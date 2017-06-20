(function () {
  'use strict';

  var g_token = localStorage.token || '';
  window.host = localStorage.host || ""

  function guid () {
    function s4 () {
      return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  }

  function errorWrapper (callback) {
    return function (error, result) {
      if (error && error.status === 401) return window.Guacamoly.Core.onAuthFailure();

      callback(error, result);
    };
  }

  function url (path) {
    return window.host + path + '?token=' + g_token;
  }

  function origin () {
    return window.host;
  }

  function token () {
    return g_token;
  }

  function Thing (id, createdAt, tags, content, richContent, attachments, isPublic, isArchived) {
    this.id = id;
    this.createdAt = createdAt || 0;
    this.tags = tags || [];
    this.content = content;
    this.edit = false;
    this.richContent = richContent;
    this.attachments = attachments || [];
    this.public = !!isPublic;
    this.archived = !!isArchived;
  }

  function ThingsApi () {
    this._addCallbacks = [];
    this._editCallbacks = [];
    this._delCallbacks = [];
    this._operation = '';
    this._query = null;
  }

  ThingsApi.prototype.get = function (filter, isArchived, callback) {
    var that = this;
    var u = url('/api/things');
    var operation = guid();

    this._operation = operation;

    this._query = {};

    if (filter) this._query.filter = filter;
    if (isArchived) this._query.archived = true;

    this._query.skip = 0;
    this._query.limit = 10;

    superagent.get(u).query(this._query).end(errorWrapper(function (error, result) {
      // ignore this if we moved on
      if (that._operation !== operation) {
        console.log('ignore this call');
        return;
      }

      if (error && !error.response) return callback(error);
      if (result.status !== 200) return callback(new Error('Failed: ' + result.status + '. ' + result.text));

      var tmp = result.body.things.map(function (thing) {
        return new Thing(thing._id, new Date(thing.createdAt).getTime(), thing.tags, thing.content, thing.richContent.replace("(/api/files/", "(" + window.host + "/api/files/"), thing.attachments, thing.public, thing.archived);
      });

      // update skip for fetch more call
      that._query.skip += result.body.things.length;

      callback(null, tmp);
    }));
  };

  ThingsApi.prototype.fetchMore = function (callback) {
    var that = this;
    var u = url('/api/things');

    if (!this._query) return callback(new Error('no previous query'));

    superagent.get(u).query(this._query).end(errorWrapper(function (error, result) {
      if (error && !error.response) return callback(error);
      if (result.status !== 200) return callback(new Error('Failed: ' + result.status + '. ' + result.text));

      var tmp = result.body.things.map(function (thing) {
        return new Thing(thing._id, new Date(thing.createdAt).getTime(), thing.tags, thing.content, richContent.replace("(/api/files/", "(" + window.host + "/api/files/"), thing.attachments, thing.public, thing.archived);
      });

      // update skip for next call
      that._query.skip += result.body.things.length;

      callback(null, tmp);
    }));
  };

  ThingsApi.prototype.add = function (content, attachments, callback) {
    var that = this;

    superagent.post(url('/api/things')).send({
      content: content,
      attachments: attachments
    }).end(errorWrapper(function (error, result) {
      if (error && !error.response) return callback(error);
      if (result.status !== 201) return callback(new Error('Failed: ' + result.status + '. ' + result.text));

      var tmp = result.body.thing;


      var thing = new Thing(tmp._id, new Date(tmp.createdAt).getTime(), tmp.tags, tmp.content, tmp.richContent.replace("(/api/files/", "(" + window.host + "/api/files/"), tmp.attachments, tmp.public, tmp.archived);

      that._addCallbacks.forEach(function (callback) {
        setTimeout(callback.bind(null, thing), 0);
      });

      callback(null, thing);
    }));
  };

  ThingsApi.prototype.edit = function (thing, callback) {
    var that = this;

    superagent.put(url('/api/things/' + thing.id)).send(thing).end(errorWrapper(function (error, result) {
      if (error && !error.response) return callback(error);
      if (result.status !== 201) return callback(new Error('Failed: ' + result.status + '. ' + result.text));

      that._editCallbacks.forEach(function (callback) {
        setTimeout(callback.bind(null, thing), 0);
      });

      callback(null, result.body.thing);
    }));
  };

  ThingsApi.prototype.del = function (thing, callback) {
    var that = this;

    superagent.del(url('/api/things/' + thing.id)).end(errorWrapper(function (error, result) {
      if (error && !error.response) return callback(error);
      if (result.status !== 200) return callback(new Error('Failed: ' + result.status + '. ' + result.text));

      that._delCallbacks.forEach(function (callback) {
        setTimeout(callback.bind(null, thing), 0);
      });

      callback(null);
    }));
  };

  ThingsApi.prototype.getPublicThing = function (userId, thingId, callback) {
    superagent.get(url('/api/public/' + userId + '/things/' + thingId)).end(errorWrapper(function (error, result) {
      if (error && !error.response) return callback(error);
      if (result.status !== 200) return callback(new Error('Failed: ' + result.status + '. ' + result.text));

      var thing = result.body.thing;

      callback(null, new Thing(thing._id, new Date(thing.createdAt).getTime(), thing.tags, thing.content, thing.richContent, thing.attachments, thing.public));
    }));
  };

  ThingsApi.prototype.getPublic = function (userId, filter, callback) {
    var that = this;
    var u = url('/api/public/' + userId + '/things');
    var operation = guid();

    this._operation = operation;

    this._query = {};

    if (filter) this._query.filter = filter;
    this._query.skip = 0;
    this._query.limit = 10;

    superagent.get(u).query(this._query).end(errorWrapper(function (error, result) {
      // ignore this if we moved on
      if (that._operation !== operation) {
        console.log('ignore this call');
        return;
      }

      if (error && !error.response) return callback(error);
      if (result.status !== 200) return callback(new Error('Failed: ' + result.status + '. ' + result.text));

      var tmp = result.body.things.map(function (thing) {
        return new Thing(thing._id, new Date(thing.createdAt).getTime(), thing.tags, thing.content, thing.richContent, thing.attachments, thing.public);
      });

      // update skip for fetch more call
      that._query.skip += result.body.things.length;

      callback(null, tmp);
    }));
  };

  ThingsApi.prototype.fetchMorePublic = function (userId, callback) {
    var that = this;
    var u = url('/api/public/' + userId + '/things');

    if (!this._query) return callback(new Error('no previous query'));

    superagent.get(u).query(this._query).end(errorWrapper(function (error, result) {
      if (error && !error.response) return callback(error);
      if (result.status !== 200) return callback(new Error('Failed: ' + result.status + '. ' + result.text));

      var tmp = result.body.things.map(function (thing) {
        return new Thing(thing._id, new Date(thing.createdAt).getTime(), thing.tags, thing.content, thing.richContent, thing.attachments, thing.public);
      });

      // update skip for next call
      that._query.skip += result.body.things.length;

      callback(null, tmp);
    }));
  };

  ThingsApi.prototype.import = function (formData, callback) {
    superagent.post(url('/api/import')).send(formData).end(errorWrapper(function (error, result) {
      if (error) return callback(error);
      callback(null);
    }));
  };

  ThingsApi.prototype.uploadFile = function (formData, callback) {
    superagent.post(url('/api/files')).send(formData).end(errorWrapper(function (error, result) {
      if (error) return callback(error);
      callback(null, result.body);
    }));
  };

  ThingsApi.prototype.onAdded = function (callback) {
    this._addCallbacks.push(callback);
  };

  ThingsApi.prototype.onEdited = function (callback) {
    this._editCallbacks.push(callback);
  };

  ThingsApi.prototype.onDeleted = function (callback) {
    this._delCallbacks.push(callback);
  };

  ThingsApi.prototype.export = function () {
    window.location.href = url('/api/export');
  };

  function SettingsApi () {
    this._changeCallbacks = [];
  }

  SettingsApi.prototype.save = function (data, callback) {
    var that = this;

    superagent.post(url('/api/settings')).send({settings: data}).end(errorWrapper(function (error, result) {
      if (error && !error.response) return callback(error);
      if (result.status !== 202) return callback(new Error('Failed: ' + result.status + '. ' + result.text));

      that._changeCallbacks.forEach(function (callback) {
        setTimeout(callback.bind(null, data), 0);
      });

      callback(null);
    }));
  };

  SettingsApi.prototype.get = function (callback) {
    superagent.get(url('/api/settings')).end(errorWrapper(function (error, result) {
      if (error && !error.response) return callback(error);
      if (result.status !== 200) return callback(new Error('Failed: ' + result.status + '. ' + result.text));

      // just ensure we have defaults
      if (!result.body.settings.title) result.body.settings.title = 'Meemo';
      if (typeof result.body.settings.wide === 'undefined') result.body.settings.wide = false;
      if (typeof result.body.settings.wideNavbar === 'undefined') result.body.settings.wideNavbar = true;
      if (!result.body.settings.backgroundImageDataUrl) result.body.settings.backgroundImageDataUrl = '';
      if (typeof result.body.settings.keepPositionAfterEdit === 'undefined') result.body.settings.keepPositionAfterEdit = false;
      if (typeof result.body.settings.publicBackground === 'undefined') result.body.settings.publicBackground = false;
      if (typeof result.body.settings.showTagSidebar === 'undefined') result.body.settings.showTagSidebar = false;

      callback(null, result.body.settings);
    }));
  };

  SettingsApi.prototype.onChanged = function (callback) {
    this._changeCallbacks.push(callback);
  };

  function TagsApi () {}

  TagsApi.prototype.get = function (callback) {
    superagent.get(url('/api/tags')).end(errorWrapper(function (error, result) {
      if (error && !error.response) return callback(error);
      if (result.status !== 200) return callback(new Error('Failed: ' + result.status + '. ' + result.text));

      result.body.tags.sort(function (a, b) { return a.name > b.name; });

      callback(null, result.body.tags);
    }));
  };

  function SessionApi () {}

  SessionApi.prototype.login = function (username, password, domain, callback) {
    if(domain.slice(-1) === '/') {
      domain = domain.slice(0, -1)
    }
    if (!/^(f|ht)tps?:\/\//i.test(domain)) {
      domain = "https://" + domain;
    }
    window.host = domain
    superagent.post(window.host + '/api/login').send({
      username: username,
      password: password
    }).end(function (error, result) {
      if (error && !error.response) return callback(error);
      if (result.status !== 201) return callback(new Error('Login failed. ' + result.status + '. ' + result.text));

      g_token = result.body.token;
      localStorage.token = g_token;
      localStorage.host = domain

      callback(null, result.body.user);
    });
  };

  SessionApi.prototype.logout = function () {
    superagent.get(url('/api/logout')).end(function (error, result) {
      if (error && !error.response) console.error(error);
      if (result.status !== 200) console.error('Logout failed.', result.status, result.text);

      g_token = '';
      window.host = ''
      delete localStorage.token;
      delete localStorage.host

      window.Guacamoly.Core.onLogout();
    });
  };

  SessionApi.prototype.profile = function (callback) {
    superagent.get(url('/api/profile')).end(errorWrapper(function (error, result) {
      if (error && !error.response) return callback(error);
      if (result.status !== 200) return callback(new Error('Failed: ' + result.status + '. ' + result.text));

      callback(null, result.body);
    }));
  };

  function UsersApi () {}

  UsersApi.prototype.list = function (callback) {
    superagent.get(url('/api/users')).end(function (error, result) {
      if (error && !error.response) return callback(error);
      if (result.status !== 200) return callback(new Error('User listing failed. ' + result.status + '. ' + result.text));

      callback(null, result.body.users);
    });
  };

  UsersApi.prototype.publicProfile = function (userId, callback) {
    superagent.get(url('/api/users/' + userId)).end(function (error, result) {
      if (error && !error.response) return callback(error);
      if (result.status !== 200) return callback(new Error('Fetching public profile failed. ' + result.status + '. ' + result.text));

      callback(null, result.body);
    });
  };

  window.Guacamoly = window.Guacamoly || {};
  window.Guacamoly.Core = {
    onAuthFailure: function () {},
    onLogout: function () {},
    url: url,
    origin: origin,
    token: token,
    Thing: Thing,
    session: new SessionApi(),
    settings: new SettingsApi(),
    things: new ThingsApi(),
    tags: new TagsApi(),
    users: new UsersApi()
  };

})();
