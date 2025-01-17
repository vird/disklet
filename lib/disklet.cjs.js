'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var rfc4648 = require('rfc4648');
var fs = _interopDefault(require('fs'));
var pathUtil = _interopDefault(require('path'));

function makeReactNativeDisklet() {
  throw new Error('makeReactNativeDisklet is not available on this platform');
}

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

/**
 * Interprets a path as a series of folder lookups,
 * handling special components like `.` and `..`.
 */
function normalizePath(path) {
  if (/^\//.test(path)) throw new Error('Absolute paths are not supported');
  var parts = path.split('/'); // Shift down good elements, dropping bad ones:

  var i = 0; // Read index

  var j = 0; // Write index

  while (i < parts.length) {
    var part = parts[i++];
    if (part === '..') j--;else if (part !== '.' && part !== '') parts[j++] = part;
    if (j < 0) throw new Error('Path would escape folder');
  } // Array items from 0 to j are the path:


  return parts.slice(0, j).join('/');
}
/**
 * Appends a slash if the path isn't blank.
 */

function folderizePath(path) {
  return path === '' ? path : path + '/';
}

/**
 * Lists the keys in a localStorage object.
 */
function storageKeys(storage) {
  var out = [];

  for (var i = 0; i < storage.length; ++i) {
    var _key = storage.key(i);

    if (_key != null) out.push(_key);
  }

  return out;
}
/**
 * Emulates a filesystem in memory.
 */


function makeLocalStorageDisklet(storage, opts) {
  if (storage === void 0) {
    storage = window.localStorage;
  }

  if (opts === void 0) {
    opts = {};
  }

  var prefix = opts.prefix != null ? folderizePath(opts.prefix) : '/';
  return {
    "delete": function _delete(path) {
      var file = normalizePath(path); // Try deleteing as a file:

      if (storage.getItem(prefix + file) != null) {
        storage.removeItem(prefix + file);
      } // Try deleting as a folder:


      var folder = folderizePath(file);

      for (var _i2 = 0, _storageKeys2 = storageKeys(storage); _i2 < _storageKeys2.length; _i2++) {
        var _key2 = _storageKeys2[_i2];
        if (_key2.indexOf(prefix + folder) === 0) storage.removeItem(_key2);
      }

      return Promise.resolve();
    },
    getData: function getData(path) {
      return this.getText(path).then(function (text) {
        return rfc4648.base64.parse(text);
      });
    },
    getText: function getText(path) {
      var file = normalizePath(path);
      var item = storage.getItem(prefix + file);

      if (item == null) {
        return Promise.reject(new Error("Cannot load \"" + file + "\""));
      }

      return Promise.resolve(item);
    },
    list: function () {
      var _list = _asyncToGenerator(function* (path) {
        if (path === void 0) {
          path = '';
        }

        var file = normalizePath(path);
        var out = {}; // Try the path as a file:

        if (storage.getItem(prefix + file) != null) out[file] = 'file'; // Try the path as a folder:

        var folder = folderizePath(file);

        for (var _i4 = 0, _storageKeys4 = storageKeys(storage); _i4 < _storageKeys4.length; _i4++) {
          var _key3 = _storageKeys4[_i4];
          if (_key3.indexOf(prefix + folder) !== 0) continue;

          var slash = _key3.indexOf('/', prefix.length + folder.length);

          if (slash < 0) out[_key3.slice(prefix.length)] = 'file';else out[_key3.slice(prefix.length, slash)] = 'folder';
        }

        return Promise.resolve(out);
      });

      function list(_x) {
        return _list.apply(this, arguments);
      }

      return list;
    }(),
    setData: function setData(path, data) {
      return this.setText(path, rfc4648.base64.stringify(data));
    },
    setText: function setText(path, text) {
      if (typeof text !== 'string') {
        return Promise.reject(new TypeError('setText expects a string'));
      }

      storage.setItem(prefix + normalizePath(path), text);
      return Promise.resolve();
    }
  };
}

/**
 * Emulates a filesystem in memory.
 */
function makeMemoryDisklet(storage) {
  if (storage === void 0) {
    storage = {};
  }

  return {
    "delete": function _delete(path) {
      var file = normalizePath(path); // Try deleteing as a file:

      if (storage['/' + file] != null) delete storage['/' + file]; // Try deleting as a folder:

      var folder = folderizePath(file);

      for (var _i2 = 0, _Object$keys2 = Object.keys(storage); _i2 < _Object$keys2.length; _i2++) {
        var _key = _Object$keys2[_i2];
        if (_key.indexOf('/' + folder) === 0) delete storage[_key];
      }

      return Promise.resolve();
    },
    getData: function getData(path) {
      var file = normalizePath(path);
      var item = storage['/' + file];

      if (item == null) {
        return Promise.reject(new Error("Cannot load \"" + file + "\""));
      }

      if (typeof item === 'string') {
        return Promise.reject(new Error("\"" + file + "\" is a text file."));
      }

      return Promise.resolve(item);
    },
    getText: function getText(path) {
      var file = normalizePath(path);
      var item = storage['/' + file];

      if (item == null) {
        return Promise.reject(new Error("Cannot load \"" + file + "\""));
      }

      if (typeof item !== 'string') {
        return Promise.reject(new Error("\"" + file + "\" is a binary file."));
      }

      return Promise.resolve(item);
    },
    list: function () {
      var _list = _asyncToGenerator(function* (path) {
        if (path === void 0) {
          path = '';
        }

        var file = normalizePath(path);
        var out = {}; // Try the path as a file:

        if (storage['/' + file] != null) out[file] = 'file'; // Try the path as a folder:

        var folder = folderizePath(file);

        for (var _i4 = 0, _Object$keys4 = Object.keys(storage); _i4 < _Object$keys4.length; _i4++) {
          var _key2 = _Object$keys4[_i4];
          if (_key2.indexOf('/' + folder) !== 0) continue;

          var slash = _key2.indexOf('/', 1 + folder.length);

          if (slash < 0) out[_key2.slice(1)] = 'file';else out[_key2.slice(1, slash)] = 'folder';
        }

        return Promise.resolve(out);
      });

      function list(_x) {
        return _list.apply(this, arguments);
      }

      return list;
    }(),
    setData: function setData(path, data) {
      // We use `any` here becase Flow is too dumb to know that `ArrayLike`
      // is a perfectly acceptable argument to `Uint8Array.from`:
      var flowHack = data;
      var array = Uint8Array.from(flowHack);
      storage['/' + normalizePath(path)] = array;
      return Promise.resolve();
    },
    setText: function setText(path, text) {
      if (typeof text !== 'string') {
        return Promise.reject(new TypeError('setText expects a string'));
      }

      storage['/' + normalizePath(path)] = text;
      return Promise.resolve();
    }
  };
}

/* global Buffer */

function mkdir(path) {
  return new Promise(function (resolve, reject) {
    return fs.mkdir(path, undefined, function (err) {
      return err != null && err.code !== 'EEXIST' ? reject(err) : resolve();
    });
  });
}

function rmdir(path) {
  return new Promise(function (resolve, reject) {
    return fs.rmdir(path, function (err) {
      return err != null ? reject(err) : resolve();
    });
  });
}

function readdir(path) {
  return new Promise(function (resolve, reject) {
    return fs.readdir(path, function (err, out) {
      return err != null ? reject(err) : resolve(out);
    });
  });
}

function unlink(path) {
  return new Promise(function (resolve, reject) {
    return fs.unlink(path, function (err) {
      return err != null ? reject(err) : resolve();
    });
  });
}

var Queue =
/*#__PURE__*/
function () {
  function Queue() {
    this.callBackList = [];
    this._active = false;
  }

  var _proto = Queue.prototype;

  _proto.next = function next() {
    var _this = this;

    if (this._active) return;
    var fn = this.callBackList.shift();

    if (!fn) {
      if (this.onEmpty) {
        this.onEmpty();
        this.onEmpty = undefined;
      }

      return;
    }

    this._active = true;
    fn(function () {
      _this._active = false;
      process.nextTick(function () {
        return _this.next();
      });
    });
  };

  return Queue;
}();

var writeFilePathQueue = {};

function writeFile(path, data, opts) {
  return new Promise(function (resolve, reject) {
    var currentTask = function currentTask(onEnd) {
      fs.writeFile(path, data, opts, function (err) {
        onEnd();
        err != null ? reject(err) : resolve();
      });
    };

    if (!writeFilePathQueue[path]) {
      writeFilePathQueue[path] = new Queue();

      writeFilePathQueue[path].onEmpty = function () {
        delete writeFilePathQueue[path];
      };
    }

    writeFilePathQueue[path].callBackList.push(currentTask);
    writeFilePathQueue[path].next();
  });
} // Helpers: -----------------------------------------------------------------

/**
 * Recursively deletes a file or directory.
 */


function deepDelete(path) {
  return getType(path).then(function (type) {
    if (type === 'file') {
      return unlink(path);
    }

    if (type === 'folder') {
      return readdir(path).then(function (names) {
        return Promise.all(names.map(function (name) {
          return deepDelete(pathUtil.join(path, name));
        }));
      }).then(function () {
        return rmdir(path);
      });
    }
  });
}
/**
 * Recursively creates a directory.
 */


function deepMkdir(path) {
  return mkdir(path)["catch"](function (err) {
    if (err.code !== 'ENOENT') throw err;
    return deepMkdir(pathUtil.dirname(path)).then(function () {
      return mkdir(path);
    });
  });
}
/**
 * Writes a file, creating its directory if needed.
 */


function deepWriteFile(path, data, opts) {
  return writeFile(path, data, opts)["catch"](function (err) {
    if (err.code !== 'ENOENT') throw err;
    return deepMkdir(pathUtil.dirname(path)).then(function () {
      return writeFile(path, data, opts);
    });
  });
}
/**
 * Returns a path's type, or '' if anything goes wrong.
 */


function getType(path) {
  return new Promise(function (resolve) {
    return fs.stat(path, function (err, out) {
      if (err != null) resolve('');else if (out.isFile()) resolve('file');else if (out.isDirectory()) resolve('folder');else resolve('');
    });
  });
} // --------------------------------------------------------------------------


function makeNodeDisklet(path) {
  var root = pathUtil.resolve(path);

  function locate(path) {
    return pathUtil.join(root, normalizePath(path));
  }

  return {
    "delete": function _delete(path) {
      return deepDelete(locate(path));
    },
    getData: function getData(path) {
      return new Promise(function (resolve, reject) {
        return fs.readFile(locate(path), {}, function (err, out) {
          return err != null ? reject(err) : resolve(out);
        });
      });
    },
    getText: function getText(path) {
      return new Promise(function (resolve, reject) {
        return fs.readFile(locate(path), 'utf8', function (err, out) {
          return err != null ? reject(err) : resolve(out);
        });
      });
    },
    list: function list(path) {
      if (path === void 0) {
        path = '';
      }

      var file = normalizePath(path);
      var nativePath = locate(path);
      return getType(nativePath).then(function (type) {
        var out = {};

        if (type === 'file') {
          out[file] = 'file';
          return out;
        }

        if (type === 'folder') {
          return readdir(nativePath).then(function (names) {
            return Promise.all(names.map(function (name) {
              return getType(pathUtil.join(nativePath, name));
            })).then(function (types) {
              var folder = folderizePath(file);

              for (var i = 0; i < names.length; ++i) {
                var _type = types[i];
                if (_type !== '') out[folder + names[i]] = _type;
              }

              return out;
            });
          });
        }

        return out;
      });
    },
    setData: function setData(path, data) {
      var flowHack = data;
      return deepWriteFile(locate(path), Buffer.from(flowHack), {});
    },
    setText: function setText(path, text) {
      return deepWriteFile(locate(path), text, 'utf8');
    }
  };
}

var File =
/*#__PURE__*/
function () {
  function File(disklet, path) {
    this._disklet = disklet;
    this._path = path;
  }

  var _proto = File.prototype;

  _proto["delete"] = function _delete() {
    return this._disklet["delete"](this._path);
  };

  _proto.getData = function getData() {
    return this._disklet.getData(this._path);
  };

  _proto.getText = function getText() {
    return this._disklet.getText(this._path);
  };

  _proto.setData = function setData(data) {
    return this._disklet.setData(this._path, data);
  };

  _proto.setText = function setText(text) {
    return this._disklet.setText(this._path, text);
  };

  return File;
}();

var Folder =
/*#__PURE__*/
function () {
  function Folder(disklet, path) {
    this._disklet = disklet;
    this._path = path;
  }

  var _proto2 = Folder.prototype;

  _proto2["delete"] = function _delete() {
    return this._disklet["delete"](this._path);
  };

  _proto2.file = function file(path) {
    return new File(this._disklet, this._path + '/' + path);
  };

  _proto2.folder = function folder(path) {
    return new Folder(this._disklet, this._path + '/' + path);
  };

  _proto2.listFiles = function listFiles() {
    return this._disklet.list(this._path).then(function (list) {
      return Object.keys(list).filter(function (path) {
        return list[path] === 'file';
      }).map(function (path) {
        return path.replace(/^.*\//, '');
      });
    });
  };

  _proto2.listFolders = function listFolders() {
    return this._disklet.list(this._path).then(function (list) {
      return Object.keys(list).filter(function (path) {
        return list[path] === 'folder';
      }).map(function (path) {
        return path.replace(/^.*\//, '');
      });
    });
  };

  return Folder;
}();

function downgradeDisklet(disklet) {
  return new Folder(disklet, '.');
}

function followPath(folder, parts) {
  var i = 0; // Read index

  var j = 0; // Write index
  // Shift down good elements, dropping bad ones:

  while (i < parts.length) {
    var part = parts[i++];
    if (part === '..') j--;else if (part !== '.' && part !== '') parts[j++] = part;
    if (j < 0) throw new Error('Path would escape folder');
  } // Navigate the folder:


  for (i = 0; i < j; ++i) {
    folder = folder.folder(parts[i]);
  }

  return folder;
}
/**
 * Navigates down to the file indicated by the path.
 */


function locateFile(folder, path) {
  var parts = path.split('/');
  var filename = parts.pop();
  if (filename == null) throw new Error('Empty path');
  return followPath(folder, parts).file(filename);
}
/**
 * Navigates down to the sub-folder indicated by the path.
 */

function locateFolder(folder, path) {
  var parts = path.split('/');
  return followPath(folder, parts);
}

/**
 * Applies an async function to all the files in a folder.
 */
function mapFiles(folder, f) {
  return folder.listFiles().then(function (names) {
    return Promise.all(names.map(function (name) {
      return f(folder.file(name), name, folder);
    }));
  });
}
/**
 * Applies an async function to all the sub-folders in a folder.
 */

function mapFolders(folder, f) {
  return folder.listFolders().then(function (names) {
    return Promise.all(names.map(function (name) {
      return f(folder.folder(name), name, folder);
    }));
  });
}
/**
 * Recursively applies an async function to all the files in a folder tree.
 * The file names are expanded into paths, and the result is a flat array.
 */

function mapAllFiles(folder, f) {
  function recurse(folder, f, prefix) {
    return Promise.all([mapFiles(folder, function (file, name) {
      return f(file, prefix + name, folder);
    }), mapFolders(folder, function (folder, name) {
      return recurse(folder, f, prefix + name + '/');
    })]).then(function (_ref) {
      var files = _ref[0],
          folders = _ref[1];
      return files.concat.apply(files, folders);
    });
  }

  return recurse(folder, f, '');
}

function logConsole(path, operation) {
  console.log(operation + " \"" + path + "\"");
}

function log(path, operation, opts) {
  var _opts$callback = opts.callback,
      callback = _opts$callback === void 0 ? logConsole : _opts$callback,
      _opts$verbose = opts.verbose,
      verbose = _opts$verbose === void 0 ? false : _opts$verbose;

  if (verbose || /set|delete/.test(operation)) {
    callback(path, operation);
  }
}

var LoggedFile =
/*#__PURE__*/
function () {
  function LoggedFile(file, path, opts) {
    this._file = file;
    this._path = path;
    this._opts = opts;
  }

  var _proto = LoggedFile.prototype;

  _proto["delete"] = function _delete() {
    log(this._path, 'delete file', this._opts);
    return this._file["delete"]();
  };

  _proto.getData = function getData() {
    log(this._path, 'get data', this._opts);
    return this._file.getData();
  };

  _proto.getText = function getText() {
    log(this._path, 'get text', this._opts);
    return this._file.getText();
  };

  _proto.setData = function setData(data) {
    log(this._path, 'set data', this._opts);
    return this._file.setData(data);
  };

  _proto.setText = function setText(text) {
    log(this._path, 'set text', this._opts);
    return this._file.setText(text);
  };

  _proto.getPath = function getPath() {
    return this._path;
  };

  return LoggedFile;
}();

var LoggedFolder =
/*#__PURE__*/
function () {
  function LoggedFolder(folder, path, opts) {
    this._folder = folder;
    this._path = path;
    this._opts = opts;
  }

  var _proto2 = LoggedFolder.prototype;

  _proto2["delete"] = function _delete() {
    log(this._path, 'delete folder', this._opts);
    return this._folder["delete"]();
  };

  _proto2.file = function file(name) {
    return new LoggedFile(this._folder.file(name), this._path + name, this._opts);
  };

  _proto2.folder = function folder(name) {
    return new LoggedFolder(this._folder.folder(name), this._path + name + '/', this._opts);
  };

  _proto2.listFiles = function listFiles() {
    log(this._path, 'list files', this._opts);
    return this._folder.listFiles();
  };

  _proto2.listFolders = function listFolders() {
    log(this._path, 'list folders', this._opts);
    return this._folder.listFolders();
  };

  return LoggedFolder;
}();

function makeLoggedFolder(folder, opts) {
  if (opts === void 0) {
    opts = {};
  }

  return new LoggedFolder(folder, '', opts);
}

function removeDuplicates(master, fallback) {
  var blacklist = {};
  var out = [];
  master.forEach(function (item) {
    if (/\._x_$/.test(item)) {
      blacklist[item] = true;
    } else {
      blacklist[item + '._x_'] = true;
      out.push(item);
    }
  });
  fallback.forEach(function (item) {
    if (!blacklist[item + '._x_']) out.push(item);
  });
  return out;
}
/**
 * A file within a unionFolder.
 */


var UnionFile =
/*#__PURE__*/
function () {
  function UnionFile(master, fallback, whiteout) {
    this._master = master;
    this._fallback = fallback;
    this._whiteout = whiteout;
  }

  var _proto = UnionFile.prototype;

  _proto["delete"] = function _delete() {
    return Promise.all([this._whiteout.setData([]), this._master["delete"]()["catch"](function (e) {
      return null;
    })]);
  };

  _proto.getData = function getData() {
    var _this = this;

    return this._master.getData()["catch"](function (e) {
      return _this._whiteout.getData().then(function (data) {
        throw new Error('File has been deleted');
      }, function (e) {
        return _this._fallback.getData();
      });
    });
  };

  _proto.getText = function getText() {
    var _this2 = this;

    return this._master.getText()["catch"](function (e) {
      return _this2._whiteout.getData().then(function (data) {
        throw new Error('File has been deleted');
      }, function (e) {
        return _this2._fallback.getText();
      });
    });
  };

  _proto.setData = function setData(data) {
    return this._master.setData(data);
  };

  _proto.setText = function setText(text) {
    return this._master.setText(text);
  };

  _proto.getPath = function getPath() {
    throw new Error('Cannot call getPath on a Union Folder');
  };

  return UnionFile;
}();
/**
 * Reads and writes go to a master folder, but if a read fails,
 * we will also try the fallback folder.
 */


var UnionFolder =
/*#__PURE__*/
function () {
  function UnionFolder(master, fallback) {
    this._master = master;
    this._fallback = fallback;
  }

  var _proto2 = UnionFolder.prototype;

  _proto2["delete"] = function _delete() {
    return Promise.all([mapFiles(this, function (file) {
      return file["delete"]();
    }), mapFolders(this, function (folder) {
      return folder["delete"]();
    })]).then(function () {});
  };

  _proto2.file = function file(name) {
    return new UnionFile(this._master.file(name), this._fallback.file(name), this._master.file(name + '._x_'));
  };

  _proto2.folder = function folder(name) {
    return new UnionFolder(this._master.folder(name), this._fallback.folder(name));
  };

  _proto2.listFiles = function listFiles() {
    return Promise.all([this._master.listFiles(), this._fallback.listFiles()]).then(function (values) {
      return removeDuplicates(values[0], values[1]);
    });
  };

  _proto2.listFolders = function listFolders() {
    return Promise.all([this._master.listFolders(), this._fallback.listFolders()]).then(function (values) {
      return removeDuplicates(values[0], values[1]);
    });
  };

  return UnionFolder;
}();
function makeUnionFolder(master, fallback) {
  return new UnionFolder(master, fallback);
}

function deepList(disklet, path) {
  return disklet.list(path).then(function (list) {
    return (// Recurse into subfolders:
      Promise.all(Object.keys(list).filter(function (path) {
        return list[path] === 'folder';
      }).map(function (path) {
        return deepList(disklet, path);
      })).then(function (children) {
        return _extends.apply(void 0, [list].concat(children));
      })
    );
  });
}

function logDisklet(disklet, opts) {
  if (opts === void 0) {
    opts = {};
  }

  var _opts = opts,
      _opts$callback = _opts.callback,
      callback = _opts$callback === void 0 ? function (path, operation) {
    console.log(operation + " \"" + path + "\"");
  } : _opts$callback,
      _opts$verbose = _opts.verbose,
      verbose = _opts$verbose === void 0 ? false : _opts$verbose;

  var log = function log(operation, path) {
    if (verbose || /set|delete/.test(operation)) {
      callback(path, operation);
    }
  };

  return {
    "delete": function _delete(path) {
      log('delete', normalizePath(path));
      return disklet["delete"](path);
    },
    getData: function getData(path) {
      log('get data', normalizePath(path));
      return disklet.getData(path);
    },
    getText: function getText(path) {
      log('get text', normalizePath(path));
      return disklet.getText(path);
    },
    list: function list(path) {
      log('list', path != null ? normalizePath(path) : '');
      return disklet.list(path);
    },
    setData: function setData(path, data) {
      log('set data', normalizePath(path));
      return disklet.setData(path, data);
    },
    setText: function setText(path, text) {
      log('set text', normalizePath(path));
      return disklet.setText(path, text);
    }
  };
}

function mergeDisklets(master, fallback) {
  return {
    "delete": function _delete(path) {
      return Promise.all([master["delete"](path), fallback["delete"](path)]);
    },
    getData: function getData(path) {
      return master.getData(path)["catch"](function (e) {
        return fallback.getData(path);
      });
    },
    getText: function getText(path) {
      return master.getText(path)["catch"](function (e) {
        return fallback.getText(path);
      });
    },
    list: function list(path) {
      return Promise.all([master.list(path), fallback.list(path)]).then(function (_ref) {
        var masterList = _ref[0],
            fallbackList = _ref[1];
        return _extends(fallbackList, masterList);
      });
    },
    setData: function setData(path, data) {
      return master.setData(path, data);
    },
    setText: function setText(path, text) {
      return master.setText(path, text);
    }
  };
}

function navigateDisklet(disklet, path) {
  var prefix = folderizePath(normalizePath(path));
  return {
    "delete": function _delete(path) {
      return disklet["delete"](prefix + path);
    },
    getData: function getData(path) {
      return disklet.getData(prefix + path);
    },
    getText: function getText(path) {
      return disklet.getText(prefix + path);
    },
    list: function list(path) {
      if (path === void 0) {
        path = '.';
      }

      return disklet.list(prefix + path).then(function (listing) {
        var out = {};

        for (var _path in listing) {
          out[_path.replace(prefix, '')] = listing[_path];
        }

        return out;
      });
    },
    setData: function setData(path, data) {
      return disklet.setData(prefix + path, data);
    },
    setText: function setText(path, text) {
      return disklet.setText(prefix + path, text);
    }
  };
}

function makeLocalStorageFolder(storage, opts) {
  return downgradeDisklet(makeLocalStorageDisklet(storage, opts));
}
function makeMemoryFolder(storage) {
  return downgradeDisklet(makeMemoryDisklet(storage));
}
function makeNodeFolder(path) {
  return downgradeDisklet(makeNodeDisklet(path));
}
function makeReactNativeFolder() {
  return downgradeDisklet(makeReactNativeDisklet());
}

exports.deepList = deepList;
exports.downgradeDisklet = downgradeDisklet;
exports.locateFile = locateFile;
exports.locateFolder = locateFolder;
exports.logDisklet = logDisklet;
exports.makeLocalStorageDisklet = makeLocalStorageDisklet;
exports.makeLocalStorageFolder = makeLocalStorageFolder;
exports.makeLoggedFolder = makeLoggedFolder;
exports.makeMemoryDisklet = makeMemoryDisklet;
exports.makeMemoryFolder = makeMemoryFolder;
exports.makeNodeDisklet = makeNodeDisklet;
exports.makeNodeFolder = makeNodeFolder;
exports.makeReactNativeDisklet = makeReactNativeDisklet;
exports.makeReactNativeFolder = makeReactNativeFolder;
exports.makeUnionFolder = makeUnionFolder;
exports.mapAllFiles = mapAllFiles;
exports.mapFiles = mapFiles;
exports.mapFolders = mapFolders;
exports.mergeDisklets = mergeDisklets;
exports.navigateDisklet = navigateDisklet;
//# sourceMappingURL=disklet.cjs.js.map
