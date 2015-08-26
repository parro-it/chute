import fs from 'vinyl-fs';
import multipipe from 'multipipe';
import through2 from 'through2';
import { EventEmitter } from 'events';

export default function chute(...transforms) {
  let emitError = null;
  const result = Object.assign(new EventEmitter(), {

    push(...globs) {
      const files = fs.src(...globs);
      files.on('error', emitError);
      files.pipe(this.pipe);
      return this;
    },

    save(folder) {
      this.targetStream = this.pipe.pipe(fs.dest(folder));
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
  emitError = result.emit.bind(result, 'error');
  result.pipe.on('error', emitError);

  return result;
}
