import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// --- 1. PUBLIC ROUTES ---
router.get('/customer-display/:tableId', async (req: any, res) => {
  try {
    const order = await req.prisma.order.findFirst({
      where: { 
        tableId: req.params.tableId,
        status: { in: ['CREATED', 'IN_PROGRESS', 'READY'] }
      },
      include: { items: { include: { product: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(order || {});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 2. AUTHENTICATED POS ROUTES ---

router.get('/floors', authenticate, async (req: any, res) => {
  try {
    // FALLBACK: Use main-branch if user has no branch or is on default
    const bId = (req.user.branchId && req.user.branchId !== 'default-branch') ? req.user.branchId : 'main-branch';
    
    const floors = await req.prisma.floor.findMany({
      where: { branchId: bId },
      include: { 
        tables: { 
          orderBy: { tableNumber: 'asc' },
          include: {
            orders: {
              where: { status: { in: ['CREATED', 'IN_PROGRESS', 'READY'] } },
              select: { totalAmount: true, paidAmount: true }
            }
          }
        } 
      }
    });

    const formattedFloors = floors.map((f: any) => ({
      ...f,
      tables: f.tables.map((t: any) => ({
        ...t,
        activeTotal: t.orders?.reduce((sum: number, o: any) => sum + (o.totalAmount - o.paidAmount), 0) || 0,
        orders: undefined
      }))
    }));

    res.json(formattedFloors);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/products', authenticate, async (req: any, res) => {
  try {
    const bId = (req.user.branchId && req.user.branchId !== 'default-branch') ? req.user.branchId : 'main-branch';
    const categories = await req.prisma.category.findMany({
      include: { 
        products: { 
          where: { 
            branchId: bId,
            isAvailable: true 
          },
          include: { variants: true }
        } 
      }
    });
    res.json(categories);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orders', authenticate, async (req: any, res) => {
  const { tableId, items, totalAmount, orderType, notes } = req.body;
  try {
    const bId = (req.user.branchId && req.user.branchId !== 'default-branch') ? req.user.branchId : 'main-branch';
    const terminalId = `term-${bId}`;

    let session = await req.prisma.session.findFirst({
      where: { branchId: bId, status: 'Open' },
      orderBy: { startAt: 'desc' }
    });

    if (!session) {
      session = await req.prisma.session.create({
        data: {
          terminalId,
          branchId: bId,
          openingBalance: 1000.0,
          status: 'Open'
        }
      });
    }

    let order;
    const existingOrder = tableId ? await req.prisma.order.findFirst({
      where: { tableId, status: { in: ['CREATED', 'IN_PROGRESS', 'READY'] } }
    }) : null;

    if (existingOrder) {
      order = await req.prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          totalAmount: existingOrder.totalAmount + Number(totalAmount),
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: Number(item.quantity) || 1,
              price: Number(item.price) || 0,
              notes: item.notes || ''
            }))
          }
        },
        include: { 
          table: true,
          items: { include: { product: { include: { category: true } } } } 
        }
      });
    } else {
      order = await req.prisma.order.create({
        data: {
          tableId,
          sessionId: session.id,
          totalAmount: Number(totalAmount) || 0,
          orderType: orderType || 'DINE_IN',
          notes,
          status: 'CREATED',
          items: {
            create: items.map((item: any) => ({
              productId: item.productId,
              quantity: Number(item.quantity) || 1,
              price: Number(item.price) || 0,
              notes: item.notes || ''
            }))
          }
        },
        include: { 
          table: true,
          items: { include: { product: { include: { category: true } } } } 
        }
      });
    }

    if (tableId) {
      await req.prisma.table.update({
        where: { id: tableId },
        data: { status: 'OCCUPIED' }
      });
    }

    const newItems = order.items.filter((oi: any) => items.some((reqItem: any) => reqItem.productId === oi.productId));
    const kitchenItems = newItems.filter((item: any) => item.product?.category?.sendToKitchen);
    
    if (kitchenItems.length > 0) {
      req.io.to(bId).emit('new-order', { ...order, items: kitchenItems });
    }

    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/orders/:id/payment', authenticate, async (req: any, res) => {
  const { amount, method, transactionId } = req.body;
  const orderId = req.params.id;
  try {
    const bId = (req.user.branchId && req.user.branchId !== 'default-branch') ? req.user.branchId : 'main-branch';
    const order = await req.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return res.status(404).json({ error: "Order not found" });

    const newPaidAmount = order.paidAmount + parseFloat(amount);
    await req.prisma.payment.create({
      data: { orderId, amount: parseFloat(amount), method, transactionId }
    });

    const isFullyPaid = newPaidAmount >= (order.totalAmount - 0.01);
    const updatedOrder = await req.prisma.order.update({
      where: { id: orderId },
      data: { 
        paidAmount: newPaidAmount,
        status: isFullyPaid ? 'COMPLETED' : order.status,
        paymentMethod: isFullyPaid ? method : order.paymentMethod
      }
    });

    if (isFullyPaid && order.tableId) {
      await req.prisma.table.update({
        where: { id: order.tableId },
        data: { status: 'FREE' }
      });
      req.io.to(bId).emit('table-status-updated', { tableId: order.tableId, status: 'FREE' });
    }

    req.io.to(bId).emit('order-status-updated', updatedOrder);
    res.json({ success: true, isFullyPaid, remaining: Math.max(0, order.totalAmount - newPaidAmount) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/kitchen/orders', authenticate, async (req: any, res) => {
  try {
    const bId = (req.user.branchId && req.user.branchId !== 'default-branch') ? req.user.branchId : 'main-branch';
    const orders = await req.prisma.order.findMany({
      where: {
        session: { branchId: bId },
        status: { in: ['CREATED', 'IN_PROGRESS', 'READY'] }
      },
      include: { table: true, items: { include: { product: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(orders || []);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/orders/:id/status', authenticate, async (req: any, res) => {
  try {
    const bId = (req.user.branchId && req.user.branchId !== 'default-branch') ? req.user.branchId : 'main-branch';
    const order = await req.prisma.order.update({
      where: { id: req.params.id },
      data: { status: req.body.status },
      include: { table: true }
    });

    if (order.status === 'READY' && order.tableId) {
       await req.prisma.table.update({
         where: { id: order.tableId },
         data: { status: 'FREE' }
       });
       req.io.to(bId).emit('table-status-updated', { tableId: order.tableId, status: 'FREE' });
    }

    req.io.to(bId).emit('order-status-updated', order);
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 3. SESSION MANAGEMENT ---

router.get('/terminals', authenticate, async (req: any, res) => {
  try {
    const bId = (req.user.branchId && req.user.branchId !== 'default-branch') ? req.user.branchId : 'main-branch';
    const terminals = await req.prisma.terminal.findMany({
      where: { branchId: bId },
      include: { sessions: { orderBy: { startAt: 'desc' }, take: 1 } }
    });
    res.json(terminals);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sessions/open', authenticate, async (req: any, res) => {
  try {
    const bId = (req.user.branchId && req.user.branchId !== 'default-branch') ? req.user.branchId : 'main-branch';
    const terminalId = req.body.terminalId || `term-${bId}`;
    
    const session = await req.prisma.session.create({
      data: {
        terminalId,
        branchId: bId,
        openingBalance: Number(req.body.openingBalance) || 1000.0,
        status: 'Open'
      }
    });
    res.json(session);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sessions/:id/close', authenticate, async (req: any, res) => {
  const sessionId = req.params.id;
  try {
    const updatedSession = await req.prisma.session.update({
      where: { id: sessionId },
      data: { status: "Closed", endAt: new Date() }
    });
    res.json(updatedSession);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback for path variations
router.post('/sessions/close/:id', authenticate, async (req: any, res) => {
  try {
    const updatedSession = await req.prisma.session.update({
      where: { id: req.params.id },
      data: { status: "Closed", endAt: new Date() }
    });
    res.json(updatedSession);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- 4. DATA & REPORTING ---

router.get('/settings', authenticate, async (req: any, res) => {
  try {
    const bId = (req.user.branchId && req.user.branchId !== 'default-branch') ? req.user.branchId : 'main-branch';
    const branch = await req.prisma.branch.findUnique({ where: { id: bId } });
    res.json(branch || {});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports/analytics', authenticate, async (req: any, res) => {
  try {
    const bId = (req.user.branchId && req.user.branchId !== 'default-branch') ? req.user.branchId : 'main-branch';
    const orders = await req.prisma.order.findMany({
      where: { session: { branchId: bId }, status: 'COMPLETED' },
      include: { items: { include: { product: true } }, session: { include: { terminal: true } } }
    });

    const revenueByProduct: any = {};
    let totalRevenue = 0;

    orders.forEach((o: any) => {
      totalRevenue += o.totalAmount;
      o.items.forEach((item: any) => {
        if (item.product) {
          const name = item.product.name;
          revenueByProduct[name] = (revenueByProduct[name] || 0) + (item.price * item.quantity);
        }
      });
    });

    res.json({
      totalRevenue,
      orderCount: orders.length,
      productData: Object.entries(revenueByProduct).map(([name, value]) => ({ name, value })),
      orders: orders.map((o: any) => ({
        id: o.id,
        number: o.orderNumber,
        total: o.totalAmount,
        date: o.createdAt,
        terminal: o.session?.terminal?.name || 'Main'
      }))
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/tables/:id/active-order', authenticate, async (req: any, res) => {
  try {
    const order = await req.prisma.order.findFirst({
      where: { tableId: req.params.id, status: { in: ['CREATED', 'IN_PROGRESS', 'READY'] } },
      select: { id: true }
    });
    res.json(order || {});
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
