import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export const login = async (req: any, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await req.prisma.user.findUnique({
      where: { email },
      include: { branch: true }
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      const accessToken = jwt.sign(
        { id: user.id, role: user.role, branchId: user.branchId },
        process.env.JWT_SECRET as string,
        { expiresIn: '1d' }
      );
      res.json({
        user: { id: user.id, name: user.name, email: user.email, role: user.role, branchId: user.branchId, branchName: user.branch.name },
        accessToken
      });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

export const register = async (req: any, res: Response) => {
  const { name, email, password, role, branchName } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create branch if it doesn't exist (simpler for hackathon setup)
    const branch = await req.prisma.branch.upsert({
      where: { id: 'default-branch' }, // Placeholder for demo
      update: {},
      create: { id: 'default-branch', name: branchName || 'Main Branch' }
    });

    const user = await req.prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'STAFF',
        branchId: branch.id
      }
    });

    res.json({ success: true, userId: user.id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};
