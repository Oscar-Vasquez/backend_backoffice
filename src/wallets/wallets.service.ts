import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { Wallet, Transaction, TransactionResponse } from './types';

@Injectable()
export class WalletsService {
  private readonly db: admin.firestore.Firestore;

  constructor(private readonly configService: ConfigService) {
    console.log('🚀 WalletsService inicializado');
    this.db = admin.firestore();
  }

  private async createWallet(userId: string, name: string = 'Billetera Estándar'): Promise<Wallet> {
    try {
      const walletData = {
        name,
        type: 'standard',
        balance: 0,
        status: 'active',
        userId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const walletRef = await this.db.collection('wallets').add(walletData);
      const walletDoc = await walletRef.get();
      const wallet = walletDoc.data();

      return {
        id: walletDoc.id,
        name: wallet.walletName,
        type: wallet.type,
        balance: wallet.balance,
        status: wallet.status,
        userId: wallet.userId,
        createdAt: wallet.createdAt.toDate(),
        updatedAt: wallet.updatedAt.toDate()
      };
    } catch (error) {
      console.error('Error al crear billetera:', error);
      throw new Error('Error al crear billetera');
    }
  }

  async getWallet(id: string): Promise<Wallet> {
    try {
      // Primero intentamos buscar por userId
      const walletsQuery = await this.db
        .collection('wallets')
        .where('userId', '==', id)
        .limit(1)
        .get();

      if (!walletsQuery.empty) {
        const wallet = walletsQuery.docs[0];
        const data = wallet.data();
        return {
          id: wallet.id,
          name: data.name || 'Mi Billetera',
          type: data.type || 'standard',
          balance: data.balance || 0,
          status: data.status || 'active',
          userId: data.userId,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        };
      }

      // Si no encontramos por userId, intentamos crear una nueva billetera
      const walletData = {
        name: 'Mi Billetera',
        type: 'standard',
        balance: 0,
        status: 'active',
        userId: id,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      const walletRef = await this.db.collection('wallets').add(walletData);
      const newWalletDoc = await walletRef.get();
      const newWallet = newWalletDoc.data();

      return {
        id: newWalletDoc.id,
        name: newWallet.name || 'Mi Billetera',
        type: newWallet.type || 'standard',
        balance: newWallet.balance || 0,
        status: newWallet.status || 'active',
        userId: newWallet.userId,
        createdAt: newWallet.createdAt?.toDate() || new Date(),
        updatedAt: newWallet.updatedAt?.toDate() || new Date()
      };

    } catch (error) {
      console.error('Error al obtener/crear billetera:', error);
      throw new Error('Error al obtener/crear billetera');
    }
  }

  async getBalance(id: string): Promise<{ balance: number }> {
    try {
      const wallet = await this.getWallet(id);
      return { balance: wallet.balance };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error al obtener saldo:', error);
      throw new Error('Error al obtener saldo de la billetera');
    }
  }

  async updateStatus(id: string, status: 'active' | 'inactive'): Promise<Wallet> {
    try {
      const walletRef = this.db
        .collection('wallets')
        .doc(id);

      const walletDoc = await walletRef.get();
      if (!walletDoc.exists) {
        throw new NotFoundException(`Billetera con ID ${id} no encontrada`);
      }

      await walletRef.update({
        status,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      const updatedWallet = await walletRef.get();
      const data = updatedWallet.data();
      
      return {
        id: updatedWallet.id,
        name: data.walletName,
        type: data.type,
        balance: data.balance,
        status: data.status,
        userId: data.userId,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error al actualizar estado:', error);
      throw new Error('Error al actualizar estado de la billetera');
    }
  }

  async getTransactions(id: string, page: number = 1, limit: number = 10): Promise<TransactionResponse> {
    try {
      // Primero obtenemos la billetera para asegurarnos que existe
      const wallet = await this.getWallet(id);
      const skip = (page - 1) * limit;
      
      const transactionsQuery = await this.db
        .collection('wallets')
        .doc(wallet.id)
        .collection('transactions')
        .orderBy('createdAt', 'desc')
        .offset(skip)
        .limit(limit)
        .get();

      const totalQuery = await this.db
        .collection('wallets')
        .doc(wallet.id)
        .collection('transactions')
        .count()
        .get();

      const transactions = transactionsQuery.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as Transaction[];

      const total = totalQuery.data().count;

      return {
        data: transactions,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      console.error('Error al obtener transacciones:', error);
      throw new Error('Error al obtener transacciones de la billetera');
    }
  }
} 