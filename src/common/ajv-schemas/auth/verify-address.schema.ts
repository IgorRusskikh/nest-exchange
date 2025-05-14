import Ajv from 'ajv';

const ajv = new Ajv({
  allErrors: true,
});

const schema = {
  type: 'object',
  properties: {
    signature: {
      type: 'string',
    },
  },
  required: ['signature'],
  additionalProperties: false,
};

const validate = ajv.compile(schema);

export default validate;
