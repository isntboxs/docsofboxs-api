import { createFactory } from 'hono/factory';

const factory = createFactory({
  defaultAppOptions: {
    strict: false,
  },
});

export default factory;
