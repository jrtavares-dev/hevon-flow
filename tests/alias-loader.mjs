import path from 'path';
import fs from 'fs';
import { pathToFileURL } from 'url';

export async function resolve(specifier, context, defaultResolve) {
  if (specifier === 'next/server' || specifier === 'next/headers' || specifier === 'next/navigation' || specifier === 'next/cache') {
    const nextSubpath = path.resolve(process.cwd(), 'node_modules', 'next', `${specifier.split('/')[1]}.js`);
    return {
      url: pathToFileURL(nextSubpath).href,
      shortCircuit: true,
    };
  }

  if (specifier.startsWith('@/')) {
    const subpath = specifier.slice(2);
    let resolvedPath = path.resolve(process.cwd(), 'src', subpath);
    if (!path.extname(resolvedPath)) {
      if (fs.existsSync(resolvedPath + '.js')) resolvedPath += '.js';
      else if (fs.existsSync(resolvedPath + '.jsx')) resolvedPath += '.jsx';
      else if (fs.existsSync(path.join(resolvedPath, 'index.js'))) resolvedPath = path.join(resolvedPath, 'index.js');
    }
    return {
      url: pathToFileURL(resolvedPath).href,
      shortCircuit: true,
    };
  }
  return defaultResolve(specifier, context, defaultResolve);
}
