import Ajv from 'ajv';
import { Order } from '@prisma/client';

const ajv = new Ajv({
  allErrors: true,
});

const schema = {
  type: 'object',
  properties: {
    buyToken: { type: 'string' },
    sellToken: { type: 'string' },
    buyAmount: { type: 'number' },
    sellAmount: { type: 'number' },
    isMarketOrder: { type: 'boolean' },
    side: { type: 'string', enum: ['BUY', 'SELL'] },
    orderId: { type: 'number' },
  },
  required: [
    'buyToken',
    'sellToken',
    'buyAmount',
    'sellAmount',
    'isMarketOrder',
    'side',
    'orderId',
  ],
  additionalProperties: false,
};

export const validateCreateOrder = ajv.compile<Order>(schema);
