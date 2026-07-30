import { Provide, Inject, App } from '@midwayjs/core';
import { Application } from '@midwayjs/web';
import { InjectEntityModel } from '@midwayjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { UserEntity } from '../entity/UserEntity';
import { UserRole } from '../entity/UserRole';
import { RegisterDTO } from '../dto/RegisterDTO';
import { LoginDTO } from '../dto/LoginDTO';

@Provide()
export class AuthService {
  @App()
  app: Application;

  @InjectEntityModel(UserEntity)
  userModel: Repository<UserEntity>;

  async register(data: RegisterDTO) {
    const existing = await this.userModel.findOne({ where: { email: data.email } });
    if (existing) {
      throw { status: 409, message: '邮箱已被注册' };
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const user = this.userModel.create({
      username: data.username,
      email: data.email,
      passwordHash,
      role: UserRole.USER,
    });

    await this.userModel.save(user);

    return {
      id: user.id,
      username: user.username,
      email: user.email,
    };
  }

  async login(data: LoginDTO) {
    const user = await this.userModel.findOne({ where: { email: data.email } });
    if (!user) {
      throw { status: 401, message: '邮箱或密码错误' };
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash);
    if (!isMatch) {
      throw { status: 401, message: '邮箱或密码错误' };
    }

    const jwtConfig = this.app.getConfig?.()?.jwt || {};
    const secret = jwtConfig.secret || 'campus-trade-default-secret';
    const expiresIn = jwtConfig.expiresIn || '7d';

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      secret,
      { expiresIn },
    );

    return {
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
    };
  }

  async getCurrentUser(userId: number) {
    const user = await this.userModel.findOne({ where: { id: userId } });
    if (!user) {
      throw { status: 404, message: '用户不存在' };
    }

    return {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      phone: user.phone,
      createdAt: user.createdAt,
    };
  }
}