import fs from 'vinyl-fs';
import multipipe from 'multipipe';
import through2 from 'through2';
import { EventEmitter } from 'events';
import ss from 'stream-stream';

const guardSyncErrors = fn => (chunk, enc, cb) => {
  try {
    return fn(chunk, enc, cb);
  } catch (err) {
    cb(err);
  }
};

class Chute extends EventEmitter {
  constructor(transforms) {
    super();

    this.inputStream = ss({ objectMode: true });

    const transformStreams = transforms
      .map(guardSyncErrors)
      .map(through2.obj);

    this.pipe = multipipe(...transformStreams);

    this.inputStream.pipe(this.pipe);

    this.pipe.on('error', err => this.emit('error', err));
  }

  push(...globs) {
    const files = fs.src(...globs);
    files.on('error', err => this.emit('error', err));
    this.inputStream.write(files);

    return this;
  }

  end() {
    setTimeout( () => {
      this.pipe.on('finish', () => this.emit('finish'));
      this.inputStream.end();
    }, 10);
  }

  save(folder) {
    const targetStream = this.pipe.pipe(fs.dest(folder));
    targetStream.on('finish', () => this.emit('saved'));
    return this;
  }
}

export default function chute(...transforms) {
  return new Chute(transforms);
}
