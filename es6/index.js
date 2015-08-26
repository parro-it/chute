import fs from 'vinyl-fs';
import multipipe from 'multipipe';
import through2 from 'through2';
import { EventEmitter } from 'events';
import ss from 'stream-stream';

export default function chute(...transforms) {
  let emitError = null;
  let emitFinish = null;


  const result = Object.assign(new EventEmitter(), {
    inputStream: ss({ objectMode: true }),

    push(...globs) {
      const files = fs.src(...globs);
      files.on('error', emitError);
      this.inputStream.write(files);

      return this;
    },

    end() {
      setTimeout( () => {
        this.pipe.on('finish', emitFinish);
        this.inputStream.end();
      }, 10);
    },

    save(folder) {
      const targetStream = this.pipe.pipe(fs.dest(folder));
      targetStream.on('finish', () => this.emit('saved'));
      return this;
    }

  });
  const transformStreams = transforms
    .map(fn => (chunk, enc, cb) => {
      try {
        return fn(chunk, enc, cb);
      } catch (err) {
        cb(err);
      }
    })
    .map(through2.obj);

  result.pipe = multipipe(...transformStreams);
  result.inputStream.pipe(result.pipe);

  emitError = result.emit.bind(result, 'error');
  emitFinish = result.emit.bind(result, 'finish');
  result.pipe.on('error', emitError);

  return result;
}
