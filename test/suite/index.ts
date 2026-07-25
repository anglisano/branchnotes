import * as path from 'node:path';
import Mocha from 'mocha';

export function run(): Promise<void> {
  return new Promise((resolve, reject) => {
    const mocha = new Mocha({ ui: 'bdd', color: true });
    mocha.addFile(path.resolve(__dirname, 'extension.test.js'));
    mocha.run((failures) => {
      if (failures > 0) {
        reject(new Error(`${failures} integration test(s) failed.`));
      } else {
        resolve();
      }
    });
  });
}
