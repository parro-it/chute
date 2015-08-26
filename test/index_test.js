let moduleRoot = '../es6';
if (process.env.TEST_RELEASE) {
  moduleRoot = '../dist';
}

const chute = require(moduleRoot);

describe('chute', () => {
  it('works', async () => {
    const result = await chute();
    result.should.be.equal(42);
  });
});

