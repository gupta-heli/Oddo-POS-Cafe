import express from 'express';

const router = express.Router();

// Get Table and Products via Public Token
router.get('/self-order/:token', async (req: any, res) => {
  try {
    const table = await req.prisma.table.findUnique({
      where: { selfOrderToken: req.params.token },
      include: { floor: { include: { branch: true } } }
    });

    if (!table) return res.status(404).json({ error: "Invalid QR code or token" });

    const categories = await req.prisma.category.findMany({
      include: { 
        products: { 
          where: { branchId: table.floor.branchId, isAvailable: true },
          include: { variants: true }
        } 
      }
    });

    res.json({ table, categories });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create Order via Public Token
router.post('/self-order/:token', async (req: any, res) => {
  const { items, totalAmount, notes } = req.body;
  try {
    const table = await req.prisma.table.findUnique({
      where: { selfOrderToken: req.params.token },
      include: { floor: true }
    });

    if (!table) return res.status(404).json({ error: "Invalid token" });

    // Find active session for this branch
    const session = await req.prisma.session.findFirst({
      where: { branchId: table.floor.branchId, status: 'Open' },
      orderBy: { startAt: 'desc' }
    });

    if (!session) return res.status(400).json({ error: "Store is currently closed for orders" });

    const order = await req.prisma.order.create({
      data: {
        tableId: table.id,
        sessionId: session.id,
        totalAmount,
        orderType: 'DINE_IN',
        notes: notes || 'Self-Order',
        status: 'CREATED',
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price
          }))
        }
      },
      include: { 
        table: true,
        items: { include: { product: true } } 
      }
    });

    await req.prisma.table.update({
      where: { id: table.id },
      data: { status: 'OCCUPIED' }
    });

    // Notify Kitchen
    req.io.to(table.floor.branchId).emit('new-order', order);

    res.json({ success: true, orderNumber: order.orderNumber });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
