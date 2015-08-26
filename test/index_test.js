let moduleRoot = '../es6';
if (process.env.TEST_RELEASE) {
  moduleRoot = '../dist';
}

const chute = require(moduleRoot);
import { readFileSync, unlinkSync, existsSync } from 'fs';

describe('chute', function chuteTest() {
  this.timeout(5000);

  it('is a function', () => {
    chute.should.be.a('function');
  });

  describe('that', () => {
    let chuteObj;

    before( () => {
      chuteObj = chute(() => {});
    });

    it('create a chute object', () => {
      chuteObj.should.be.a('object');
    });

    it('catch sync errors of transforms in pipeline', done => {
      const c = chute(() => {
        throw new Error('an error');
      });
      c.on('error', err => {
        err.message.should.be.equal('an error');
        done();
      });
      c.push(`${__dirname}/fixtures/simple.js`);
    });

    it('catch async errors of transforms in pipeline', done => {
      const c = chute((file, enc, cb) => {
        cb(new Error('an error'));
      });
      c.on('error', err => {
        err.message.should.be.equal('an error');
        done();
      });
      c.push(`${__dirname}/fixtures/simple.js`);
    });

    describe('with', () => {
      it('a pipe stream', () => {
        chuteObj.pipe.on.should.be.a('function');
      });

      describe('push', () => {
        it('is method', () => {
          chuteObj.push.should.be.a('function');
        });

        it('pipes vinyl files into the pipeline', done => {
          chute(file => {
            file.constructor.name.should.be.equal('File');
            done();
          }).push(`${__dirname}/fixtures/simple.js`);
        });

        it('could be called multiple time', done => {
          const results = [];
          const c = chute((file, enc, cb) => {
            results.push(file.contents.toString('utf-8'));
            cb(null, file);
          })
            .push(`${__dirname}/fixtures/simple.js`)
            .push(`${__dirname}/fixtures/other.js`);

          c.on('error', done);
          c.on('finish', () => {
            results.should.be.deep.equal([
              'const response=42;\n',
              'const other=42;\n'
            ]);
            done();
          });

          c.end();
        });

        it('return chute instance for chaining', () => {
          const c = chute(() => {});
          const c2 = c.push(`${__dirname}/fixtures/simple.js`);
          c2.should.be.equal(c);
        });

        it('vinyl files into the pipeline', done => {
          chute(file => {
            file.constructor.name.should.be.equal('File');
            file.contents.should.be.instanceOf(Buffer);
            done();
          }).push(`${__dirname}/fixtures/simple.js`);
        });
      });

      describe('save', () => {
        it('is method', () => {
          chuteObj.save.should.be.a('function');
        });

        it('when given a string save all files to destination', done => {
          const targetPath = `${__dirname}/output/simple.js`;
          if (existsSync(targetPath)) {
            unlinkSync(targetPath);
          }

          const c = chute((file, env, cb) => {
            file.contents = new Buffer(file.contents.toString('utf-8').toUpperCase());
            cb(null, file);
          });
          c.on('error', done);

          c.save(`${__dirname}/output`);
          c.push(`${__dirname}/fixtures/simple.js`);

          c.on('error', done);
          c.on('saved', () => {
            const res = readFileSync(targetPath, 'utf-8');
            res.should.be.equal('CONST RESPONSE=42;\n');
            unlinkSync(targetPath);
            done();
          });

          c.end();
        });
      });
    });
  });
});

