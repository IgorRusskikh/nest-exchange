import { IOrderInfo } from 'src/common/interfaces/orders/blockchain-order-info.interface';
import { ethers } from 'ethers';

interface IGetOrderInfoParams {
  orderId: string;
  contract: ethers.Contract;
  logger?: Console;
}

export async function getOrderInfoFromBlockchain({
  orderId,
  contract,
  logger = console,
}: IGetOrderInfoParams): Promise<IOrderInfo> {
  try {
    const [
      id,
      amountA,
      amountB,
      amountFilledA,
      amountFilledB,
      tokenA,
      tokenB,
      user,
      isMarket,
    ] = await contract.getOrderInfo(orderId);

    const order: IOrderInfo = {
      id,
      amountA,
      amountB,
      tokenA,
      tokenB,
      user,
      isMarket,
      amountFilledA,
      amountFilledB,
    };

    return order;
  } catch (error) {
    logger.error(
      `Error getting order info from blockchain for order ${orderId}:`,
      error,
    );
    throw error;
  }
}
