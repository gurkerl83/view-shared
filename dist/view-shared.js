
/*
require 'restangular'
 */

(function() {
  var AggregationModel, AggregationRest, DBSchemas, Database, ProviderRestangular, SideMenu, TestApp, async, squel;

  require('ng-cordova-sqlite');


  /*
  require './db/DBSchemas'
  
  require './services/AggregationModel'
  require './services/AggregationRest'
  require './services/Database'
  require './services/ProviderRestangular'
  require './services/SideMenu'
   */

  require('underscore');

  require('restangular');

  TestApp = (function() {
    function TestApp() {
      return ['restangular', 'ngCordova.plugins.sqlite'];
    }

    return TestApp;

  })();

  module.exports = TestApp;

  angular.module('shared_view.module', TestApp());

  DBSchemas = (function() {
    function DBSchemas() {
      return {
        create: {
          notes: 'CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY, title TEXT, content TEXT, createTime DATETIME, modifyTime DATETIME, state INTEGER, tags TEXT, color INTEGER DEFAULT -1, selected INTEGER DEFAULT -1)',
          notes_attach: 'CREATE TABLE IF NOT EXISTS notes_attach(id INTEGER PRIMARY KEY, url TEXT, noteId INTEGER, createTime DATETIME)',
          notes_tag: 'CREATE TABLE IF NOT EXISTS notes_tag(id INTEGER PRIMARY KEY, name TEXT, createTime DATETIME, latestTime DATETIME, useCount INTEGER, pinyin TEXT, fpinyin TEXT, selected INTEGER DEFAULT -1)',
          notes_tag_set: 'CREATE TABLE IF NOT EXISTS notes_tag_set(tagId INTEGER, noteId INTEGER, FOREIGN KEY(tagId) REFERENCES notes_tag(id), FOREIGN KEY(noteId) REFERENCES notes(id))',
          rss_list: 'CREATE TABLE IF NOT EXISTS rss_list(id INTEGER PRIMARY KEY, title TEXT, link TEXT, desc TEXT, image TEXT, url TEXT, createTime DATETIME, updateTime DATETIME)',
          rss_items: 'CREATE TABLE IF NOT EXISTS rss_items(id INTEGER PRIMARY KEY, rssId INTEGER, title TEXT, link TEXT, category TEXT, description TEXT, pubDate DATETIME, author TEXT, comments TEXT, source TEXT, FOREIGN KEY(rssId) REFERENCES rss_list(id))',
          subscripts: 'CREATE TABLE IF NOT EXISTS subscripts(rssId INTEGER, createTime DATETIME, FOREIGN KEY(rssId) REFERENCES rss_list(id))'
        },
        insert: {
          notes: 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(:title, :content, :createTime, :modifyTime, 1, :tags)'
        },
        select: {
          notes: 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(:title, :content, :createTime, :modifyTime, 1, :tags)'
        }

        /*
        create: [
          {
            notes: 'CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY, title TEXT, content TEXT, createTime DATETIME, modifyTime DATETIME, state INTEGER, tags TEXT, color INTEGER DEFAULT -1, selected INTEGER DEFAULT -1)'
          },
        ],
        
        insert: [
          {
            notes: 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(:title, :content, :createTime, :modifyTime, 1, :tags)'
          },
        ],
        
        select: [
          {
            notes: 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(:title, :content, :createTime, :modifyTime, 1, :tags)'
          },
        ]
         */
      };
    }

    return DBSchemas;

  })();

  module.exports = DBSchemas;

  angular.module('shared_view.module').constant('DBSCHEMAS', DBSchemas());

  async = require('async');

  squel = require('squel');

  AggregationModel = (function() {
    function AggregationModel(DBSCHEMAS, databaseService) {
      var DefaultChars, Digits, dataLoaded, dealGetLatestPosts, dealGetPostsWithTag, dealGetTags, items, process, process2, randomString, resultTransactions, _color, _keyword, _pageSize, _postInfo, _provider, _tagInfo;
      this.globalTags = array();
      resultTransactions = array();
      items = {};
      dataLoaded = false;
      this.currentNode = void 0;
      this.state = 'initial';
      this.processResultTransactions = function(filterOn, callback) {
        if (databaseService.db === void 0) {
          databaseService.connect();
        }

        /*
        async.series([
        
            dealGetTags
            process
        
             *dealGetTags(callback)
             *process(filterOn, callback)
          ],
          callback(items))
         */

        /*
        async.series [
          (cb) -> dealGetTags cb
          (cb) -> process cb
        ], callback
         */

        /*
        async.series [
          (callback) ->
        
            dealGetTags callback
        
             * do some stuff ...
             *callback null, "one"
          (callback) ->
        
            process callback
        
             * do some more stuff ...
             *callback null, "two"
        
         * optional callback
        ], (err, results) ->
        
          if err
            console.log err
        
          if results
            console.log results
         */
        dealGetTags(callback);
        return items;
      };
      dealGetTags = function(callback) {
        var params2, query;
        resultTransactions = array();
        items = {};
        params2 = ["facebook"];
        query = squel.select().from(squel.select().from('notes_tag'), 't').field('t.*').from(squel.select().from('notes_tag_set'), 'ts').field('ts.noteId', 'postCount').from(squel.select().from('notes'), 'n').where(squel.expr().and("t.id = ts.tagId").and("ts.noteId = n.id").and("n.content = 'facebook'").and("n.state <> 0")).group("ts.tagId").order("useCount", false).order("latestTime", false).limit(100).toString();
        return databaseService.db.transaction(function(tx) {
          return tx.executeSql(query, [], (function(tx, result) {
            var i, _i, _ref;
            for (i = _i = 0, _ref = result.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
              resultTransactions.push(result.rows.item(i));
            }
            console.log("dealGetTags");
            return process(callback);
          }), function(tx, error) {
            return console.log(error);
          });
        });
      };
      process = function(callback) {
        debugger;
        var firstLetter, i;
        firstLetter = void 0;
        i = 0;
        while (i < resultTransactions.length) {
          firstLetter = resultTransactions[i]['name'].substring(0, 1).toUpperCase();
          if (!items[firstLetter]) {
            items[firstLetter] = [];
          }
          items[firstLetter].push(resultTransactions[i]);
          i++;
        }
        if (callback) {
          return callback(items);
        }
      };
      process2 = function(callback) {
        var firstLetter, i;
        firstLetter = void 0;
        i = 0;
        while (i < resultTransactions.length) {
          firstLetter = resultTransactions[i]['title'].substring(0, 1).toUpperCase();
          console.log(firstLetter);
          if (!items[firstLetter]) {
            items[firstLetter] = [];
          }
          items[firstLetter].push(resultTransactions[i]);
          i++;
        }

        /*
        for value, index in items
          element = JSON.parse(value);
         */

        /*
        j = 0
        while j < items.length
        
          console.log items[j]['firstLetter']
        
          items[j]['firstLetter'] = 'K'
        
          console.log items[j]['firstLetter']
         */

        /*
        for i in [0 ... items.length]
          items[i] result.rows.item(i)
        
        items[firstLetter]
        firstLetter = firstLetter + rs.random(20,'ABCD0987');   # ABCD0987
         */
        if (callback) {
          return callback(items);
        }
      };
      this.currentItems = {};
      this.selectedItem;
      _tagInfo = void 0;
      _postInfo = void 0;
      _pageSize = void 0;
      _provider = void 0;
      this.initGetPostsWithTagToken = function(tag, provider, filterOn, callback) {
        resultTransactions = array();
        items = {};
        _tagInfo = tag;
        _provider = provider;
        if (databaseService.db === void 0) {
          databaseService.connect();
        }

        /*
        async.series([
            dealGetPostsWithTag()
        
             *process(filterOn)
            process2(filterOn)
          ],
          callback(items))
         */
        dealGetPostsWithTag(callback);
        return items;
      };
      dealGetPostsWithTag = function(callback) {
        var expr, query;
        resultTransactions = void 0;
        resultTransactions = array();
        expr = squel.expr();

        /*
        if _postInfo
        
          expr = expr.and("modifyTime < ?", squel.select().field('modifyTime').from('notes').where("id = ?", _postInfo.id))
         */

        /*
        condictionString = ""
        
        if (_postInfo != null)
        
           *params[":id"] = _postInfo.id;
          condictionString += " AND modifyTime < (SELECT modifyTime FROM notes WHERE id=:id)";
        
         *"SELECT id,title,modifyTime,content,color,selected FROM notes WHERE state = 1 AND content = :contentId AND ';'||tags||';' like '%;'||:keyword||';%'" + condictionString + " ORDER BY title ASC LIMIT 0," + _pageSize.toString(), params
         */
        query = squel.select().field('id').field('title').field('modifyTime').field('content').field('color').field('selected').from('notes').where('tags LIKE ?', '%' + _tagInfo.name + '%').toParam();
        return databaseService.db.transaction(function(tx) {
          return tx.executeSql(query.text, query.values, (function(tx, result) {
            var i, _i, _ref;
            for (i = _i = 0, _ref = result.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
              resultTransactions.push(result.rows.item(i));
            }
            console.log("dealGetPostsWithTag");
            return process2(callback);
          }), function(tx, error) {
            return console.log(error);
          });
        });
      };
      _keyword = void 0;
      _color = -1;
      this.initGetLatestPostsToken = function(lastPost, pageSize, keyword, color, filterOn, callback) {
        _postInfo = lastPost;
        _pageSize = pageSize;
        _keyword = keyword;
        _color = color;
        if (databaseService.db === void 0) {
          databaseService.connect();
        }
        async.series([dealGetLatestPosts(), process(filterOn)], callback(items));
        return items;
      };
      dealGetLatestPosts = function() {
        var expr, query;
        expr = squel.expr();
        if (_keyword) {
          expr = expr.and("title like = ?", _keyword).or("content like = ?", _keyword).or("tags like = ?", _keyword);
        }
        if (_color !== 0xffffff && _color >= 0) {
          expr = expr.and("color = ?", _color);
        }
        if (_postInfo !== null) {
          expr.and("modifyTime < ?", squel.select().field('modifyTime').from('notes').where("id = ?", _postInfo.id));
        }
        query = squel.select().from('notes').field('id').field('title').field('modifyTime').field('color').field('selected').where(expr.and("state = '1'")).order("title", true).limit(0, 100).toString();
        return databaseService.db.transaction(function(tx) {
          return tx.executeSql(query, [], (function(tx, result) {
            var i, _i, _ref;
            for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
              console.log(result.rows.item(i));
            }
            console.log("result.rows.length");
            console.log(result.rows.length);
            return console.log("dealGetUsedTags");
          }), function(tx, error) {
            return console.log(error);
          });
        });
      };
      this.getFirst = function(number) {
        var query;
        query = squel.select().from('notes').limit(number).toString();
        return databaseService.db.transaction(function(tx) {
          return tx.executeSql(query, [], (function(tx, result) {
            var i, output, _i, _ref;
            output = [];
            for (i = _i = 0, _ref = result.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
              output.push(result.rows.item(i));
            }
            console.log("getFirst");
            return output;
          }), function(tx, error) {
            return console.log(error);
          });
        });
      };
      this.getAllByName = function(name) {
        var query;
        query = squel.select().from('notes').where('tags LIKE ?', '%' + name.toLowerCase() + '%').order("name", true).toParam();
        return databaseService.db.transaction(function(tx) {
          return tx.executeSql(query.text, query.values, (function(tx, result) {
            var i, output, _i, _ref;
            output = [];
            for (i = _i = 0, _ref = result.rows.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
              output.push(result.rows.item(i));
            }
            console.log("getAllByName");
            return output;
          }), function(tx, error) {
            return console.log(error);
          });
        });
      };
      Digits = '0123456789';
      DefaultChars = Digits + 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
      randomString = function(length, chars) {
        var chosen;
        if (length == null) {
          length = 32;
        }
        if (chars == null) {
          chars = DefaultChars;
        }
        chosen = [];
        while (chosen.length < length) {
          chosen.push(chars[Math.floor(Math.random() * chars.length)]);
        }
        return chosen.join('');
      };
    }

    return AggregationModel;

  })();

  module.exports = AggregationModel;

  angular.module('shared_view.module').service('aggregationModelService', ['DBSCHEMAS', 'databaseService', AggregationModel]);

  async = require('async');

  squel = require('squel');

  AggregationRest = (function() {
    function AggregationRest(Restangular, aggregationModelService, $cordovaSQLite, DBSCHEMAS, databaseService) {
      var dbCheck, dbCheckIntervalId, dealGetLatestPosts, dealGetPostInfo, dealGetPostsWithTag, dealGetUsedTags, dealSetPostColor, dealSetPostState, existsTagResultHandler, existsTagResultHandler_, expectedDBCallbacks, failureInsert, importFriends, initGetLatestPostsToken, initGetPostInfoToken, initGetPostsWithTagToken, initGetTagsToken, initGetUsedTagsToken, initMaskPostColor, initMaskPostState, lastInsertRowID, preProcess, preProcess2, preProcess_, successInsert, updateUsedTags, updateUsedTagsCallAbsoluteCounter, updateUsedTagsCallRelativeCounter, userData, _color, _keyword, _pageNo, _pageSize, _postInfo;
      userData = void 0;
      this.getTags__ = function() {

        /*
        
        var offset:int = (_pageNo - 1) * 100;
        
        			//var token:SqliteDatabaseToken = _facade.documentDatabase.createCommandToken("SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT " + offset + ",30");
        
        			//working
        			//var token:SqliteDatabaseToken = _facade.documentDatabase.createCommandToken("SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT " + offset + ",100");
        
        			var params:Dictionary = new Dictionary();
        			params[":contentId"] = _provider;
        			var token:SqliteDatabaseToken = _facade.documentDatabase.createCommandToken("SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.content = :contentId AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT 100", params);
         */
        var params2;
        if (databaseService.db === void 0) {
          databaseService.connect();
        }
        params2 = ["facebook"];
        return $cordovaSQLite.execute(databaseService.db, 'SELECT * FROM notes_tag', []).then(function(data) {
          var i, result;
          i = 0;
          while (i < data.rows.length) {
            result = data.rows.item(i);
            console.log(result);
            i++;
          }
        });
      };
      this.imported = false;
      this.getUsers = function(type, callback) {
        window.localStorage.setItem("state", "first");
        if (databaseService.db === void 0) {
          databaseService.connect();
        }
        return Restangular.one('friends').customPOST(JSON.stringify({}), "", {}, {
          "Content-Type": "application/json",
          "providerId": "facebook",
          "apikey": "markus.gritsch.5"
        }).then(function(result) {
          return async.forEachSeries(result.socialFriends, preProcess, function(err) {
            console.log("Error in preProcess" != null);
            if (callback) {
              return callback();
            }
          });
        });
      };
      preProcess = function(socialFriend, callback) {
        var account, children, currentEntity, element, email, firstName, groupList, groupListLen, groupListLenght, j, lastName, name, tags;
        name = "";
        firstName = "";
        lastName = "";
        email = "";
        groupList = null;
        if (socialFriend.fullName === void 0 || socialFriend.fullName === null) {
          name = "";
        } else {
          name = socialFriend.fullName.capitalize(true);
        }
        if (socialFriend.firstName === void 0 || socialFriend.firstName === null) {
          firstName = "";
        } else {
          firstName = socialFriend.firstName.capitalize(true);
        }
        if (socialFriend.lastName === void 0 || socialFriend.lastName === null) {
          lastName = "";
        } else {
          lastName = socialFriend.lastName.capitalize(true);
        }
        if (socialFriend.email === void 0 || socialFriend.email === null) {
          email = "";
        } else {
          email = socialFriend.email.capitalize(true);
        }
        if (socialFriend.groupList === void 0 || socialFriend.groupList === null) {
          groupList = array();
        } else {
          groupList = array(socialFriend.groupList);
        }
        account = {
          name: name,
          firstName: firstName,
          lastName: lastName,
          email: email,
          groupList: groupList,
          type: "1",
          startBalance: "1",
          insertDate: "1",
          startDate: "1",
          description: "1",
          synchDate: "1",
          visible: "1",
          importColumnsOrder: "1",
          importDateFormat: "1",
          uid: "1",
          bankAccountUID: "1",
          transferToBankAccountUID: "2",
          transferAmount: "10",
          insertDate: new Date(),
          date: new Date(),
          description: "",
          tagColor: "",
          amount: 5.56789,
          totalAmount: 5.56789,
          category: "Social Networks",
          entity: "Counter 0",
          item: {
            categoriesInTransaction: {
              categoryUID: "100",
              transactionUID: "101",
              amount: 5.56789,
              synchDate: new Date(),
              deleted: false
            }
          }
        };
        if (account.name === "") {
          if (account.firstName !== "" && account.lastName !== "") {
            account.name = account.firstName.concat(" ").concat(account.lastName);
          }
        }
        if (account.name === "") {
          account.name = account.email;
        }
        if (account.name === "") {

        } else {
          if (account.groupList.length === 0) {
            tags = null;
            tags = "";
            tags = tags.concat("Unorganized");
            currentEntity = null;
            aggregationModelService.globalTags.each(function(entity) {
              if (entity.name === "Unorganized") {
                currentEntity = entity;
              }
            });
            if (currentEntity == null) {
              children = array();
              children.push(account);
              element = {
                id: aggregationModelService.globalTags.length,
                parent: null,
                name: "Unorganized",
                canSelect: true,
                children: children,
                insertDate: new Date(),
                date: new Date(),
                amount: 5.56789,
                totalAmount: 5.56789,
                item: {
                  insertDate: new Date(),
                  date: new Date()
                }
              };
              aggregationModelService.globalTags.push(element);
            } else {
              currentEntity.children.push(account);
            }
            account.tags = tags;
            importFriends(account, callback);
          } else {
            tags = null;
            tags = "";
            groupListLenght = account.groupList.length;
            j = 0;
            groupListLen = groupListLenght;
            while (j < groupListLen) {
              tags = tags.concat(account.groupList[j]);
              currentEntity = null;
              aggregationModelService.globalTags.each(function(entity) {
                if (entity.name === account.groupList[j]) {
                  currentEntity = entity;
                }
              });
              if (currentEntity == null) {
                children = array();
                children.push(account);
                element = {
                  id: aggregationModelService.globalTags.length,
                  parent: null,
                  name: account.groupList[j],
                  canSelect: true,
                  children: children,
                  insertDate: new Date(),
                  date: new Date(),
                  amount: 5.56789,
                  totalAmount: 5.56789,
                  item: {
                    insertDate: new Date(),
                    date: new Date()
                  }
                };
                aggregationModelService.globalTags.push(element);
              } else {
                currentEntity.children.push(account);
              }
              if (j < (groupListLenght - 1)) {
                tags = tags.concat(";");
              }
              j++;
            }
            account.tags = tags;
            importFriends(account, callback);
          }
        }
        return aggregationModelService.globalTags.sort("name", "ascending");
      };
      preProcess_ = function(socialFriend, callback) {

        /*
        fs.exists dirName, (exists) ->
          unless exists
            callback() if callback
            return
          fs.remove dirName, (error) ->
            callback() if callback
         */
        var i, _i, _ref, _tags;
        console.log(socialFriend);
        if (socialFriend.groupList.length === 0) {
          _tags = null;
          _tags = "";
          _tags = _tags.concat("Unorganized");
          socialFriend.tags = _tags;
          return importFriends(socialFriend, callback);
        } else {
          _tags = null;
          _tags = "";
          for (i = _i = 0, _ref = socialFriend.groupList.length; _i <= _ref; i = _i += 1) {
            _tags = _tags.concat(socialFriend.groupList[i]);
            if (i < (socialFriend.groupList.length - 1)) {
              _tags = _tags.concat(";");
            }
          }
          socialFriend.tags = _tags;
          return importFriends(socialFriend, callback);
        }
      };
      preProcess2 = function(globalTag, callback) {
        var query;
        console.log("globalTag is");
        query = squel.select().from("notes_tag").where('name = "' + globalTag.name + '"').toString();
        $cordovaSQLite.execute(databaseService.db, query, []).then(function(data) {
          console.log("data.insertId is");
          return console.log(data.insertId);
        });
        userData = globalTag;
        if (callback) {
          return callback();
        }
      };
      this.getUsersFromLocalDB = function(callback) {

        /*
        async.forEachSeries socialFriends, cleanDir, ->
          callback() if callback
         */
        if (databaseService.db === void 0) {
          databaseService.connect();
        }
        return $cordovaSQLite.execute(databaseService.db, 'SELECT * FROM notes', []).then(function(data) {
          var i, result;
          i = 0;
          while (i < data.rows.length) {
            result = data.rows.item(i);
            console.log(result);
            i++;
          }
        });
      };
      lastInsertRowID = -1;

      /*
      connect = ->
        devicePath = if $cordovaDevice.getPlatform() == "iOS" then steroids.app.path else steroids.app.absolutePath
        dbPath =  devicePath + "/data/database";
         *db = $cordovaSQLite.openDB(dbPath)
        db = $cordovaSQLite.openDBBackground(dbPath)
      
        initializeDatabase()
      
      initializeDatabase = ->
        $cordovaSQLite.execute(db, DBSCHEMAS.create.notes, [])
      
        $cordovaSQLite.execute(db, DBSCHEMAS.create.notes_attach, [])
      
        $cordovaSQLite.execute(db, DBSCHEMAS.create.notes_tag, [])
      
        $cordovaSQLite.execute(db, DBSCHEMAS.create.notes_tag_set, [])
      
        $cordovaSQLite.execute(db, DBSCHEMAS.create.rss_list, [])
        $cordovaSQLite.execute(db, DBSCHEMAS.create.rss_items, [])
        $cordovaSQLite.execute(db, DBSCHEMAS.create.subscripts, [])
       */
      expectedDBCallbacks = 0;
      dbCheckIntervalId = 0;

      /*
      importFriends = (account, index, count) ->
      
        date = new Date();
        params2 = [account.name, "facebook", date.toUTCString(), date.toUTCString(), 1, account.tags]
      
        insert = 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(?, ?, ?, ?, ?, ?)'
      
        db.transaction (tx) ->
          tx.executeSql insert, params2, successInsert, failureInsert
      
           *tx.executeSql "INSERT INTO mytable (thing) VALUES (" + i + ")", [], successInsert, failureInsert
          expectedDBCallbacks++
       */

      /*
      importFriends = (account, index, count) ->
      
        date = new Date();
        params1 = [account.name, "facebook", date.toUTCString(), date.toUTCString(), 1, account.tags]
      
        query1 = 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(?, ?, ?, ?, ?, ?)'
      
        params2 = undefined
      
        if aggregationModelService.globalTags != null && aggregationModelService.globalTags.length > 0
      
          aggregationModelService.globalTags.each (tagName) ->
      
            params2 = [tagName.name]
      
            userData = tagName;
      
        $cordovaSQLite.nestedExecute(db, query1, 'SELECT * FROM notes_tag WHERE name = ?', params1, params2).then (data) ->
      
          existsTagResultHandler data.rows
       */
      successInsert = function(tx, result) {
        expectedDBCallbacks--;
        updateUsedTags();
      };
      failureInsert = function(tx, error) {
        expectedDBCallbacks--;
        console.log("failureInsert");
      };
      dbCheck = function() {
        if (expectedDBCallbacks === 0) {
          clearInterval(dbCheckIntervalId);
          allDone();
        }
      };

      /*
      importFriends = (account, index, count) ->
      
        date = new Date();
        params2 = [account.name, "facebook", date.toUTCString(), date.toUTCString(), 1, account.tags]
      
        insert = 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(?, ?, ?, ?, ?, ?)'
      
      
        db.transaction (tx) ->
          tx.executeSql insert, params2, ((tx, result) ->
      
            lastInsertRowID = data.insertId
      
            updateUsedTags()
      
            return
      
          ), (tx, error) ->
      
            console.log "error in transaction"
      
            return
       */
      importFriends = function(account, callback) {
        var date, insert, params2, query;
        date = new Date();
        params2 = [account.name, "facebook", date.toUTCString(), date.toUTCString(), 1, account.tags];
        insert = 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(?, ?, ?, ?, ?, ?)';
        query = squel.insert().into("notes").set("title", account.name).set("content", "facebook").set("createTime", date.toUTCString()).set("modifyTime", date.toUTCString()).set("state", 1).set("tags", account.tags).toParam();
        $cordovaSQLite.execute(databaseService.db, query.text, query.values).then(function(data) {
          lastInsertRowID = data.insertId;
          console.log("lastInsertRowID is");
          console.log(lastInsertRowID);
          updateUsedTags(callback);

          /*
          var post:Object = new Object();
          post.id = _id;
          post.title = _title;
          post.modifyTime = new Date();
          post.tags = _tags;
           */
        });
      };
      updateUsedTagsCallRelativeCounter = 0;
      updateUsedTagsCallAbsoluteCounter = 0;
      updateUsedTags = function(callback) {
        var pkey;
        if (aggregationModelService.globalTags !== null && aggregationModelService.globalTags.length > 0) {

          /*
          async.forEachSeries aggregationModelService.globalTags, preProcess2, (err) ->
          
            console.log "Error in preProcess2"?
          
            callback() if callback
           */
          pkey = "name";
          async.forEachSeries(aggregationModelService.globalTags, function(globalTag, callback) {
            var params2, query, queryLastRowID;
            params2 = [globalTag.name];
            query = "SELECT * FROM notes_tag WHERE name = ?";
            queryLastRowID = "SELECT last_insert_rowid() FROM notes_tag";

            /*
            $cordovaSQLite.execute(db, queryLastRowID, []).then (data) ->
              console.log "Last Row ID:"
              console.log data
             */
            databaseService.db.transaction(function(tx) {
              return tx.executeSql(query, params2, (function(tx, result) {
                console.log(result);
                return existsTagResultHandler(result.rows, callback);
              }), function(tx, error) {
                return console.log(error);
              });
            });

            /*
             *$cordovaSQLite.execute(db, query, []).then (data) ->
            $cordovaSQLite.execute(db, query, params2).then (data) ->
             *$cordovaSQLite.execute(db, query.text, query.values).then (data) ->
            
               *console.log("data.insertId is");
               *console.log(data.insertId);
            
              console.log("data.insertId is");
              console.log data
            
              i = 0
            
              while i < data.rows.length
                 *$scope.result = data.rows.item(i)
                result = data.rows.item(i)
            
                 *console.log $scope.result
                console.log result
            
                i++
            
               *existsTagResultHandler data.rows, callback
              existsTagResultHandler data, callback
             */
            userData = globalTag.name;

            /*
            console.log 'updateUsedTagsCallRelativeCounter is'
            console.log updateUsedTagsCallRelativeCounter
            
            updateUsedTagsCallAbsoluteCounter++
            
            console.log 'updateUsedTagsCallAbsoluteCounter is'
            console.log updateUsedTagsCallAbsoluteCounter
            
            callback() if callback
             */
          }, function(err) {
            console.log("Error in inline preProcess2" != null);
            if (callback) {
              return callback();
            }
          });

          /*
          aggregationModelService.globalTags.each (tagName) ->
          
             *params = []
            params = new dictionary()
            params[":name"] = tagName.name
          
            params2 = [tagName.name]
          
             *$cordovaSQLite.execute(db, DBSCHEMAS.select.notes, []).then (data) ->
             *$cordovaSQLite.execute(db, 'SELECT * FROM notes_tag WHERE name = :name', params).then (data) ->
          
             *query = squel.select().from("notes_tag").where("name = ?", tagName.name).toString()
            query = squel.select().from("notes_tag").where('name = "' + tagName.name + '"').toString()
          
             *$cordovaSQLite.execute(db, 'SELECT * FROM notes_tag WHERE name = ?', params2).then (data) ->
            $cordovaSQLite.execute(db, query, []).then (data) ->
          
              console.log("data.insertId is");
              console.log(data.insertId);
          
              existsTagResultHandler data.rows, callback
               *existsTagResultHandler(callback)
          
              return
          
          
            userData = tagName;
             *userData = tagName.name;
           */
        } else {
          console.log('updateUsedTagsCallRelativeCounter is');
          console.log(updateUsedTagsCallRelativeCounter);
          updateUsedTagsCallAbsoluteCounter++;
          console.log('updateUsedTagsCallAbsoluteCounter is');
          console.log(updateUsedTagsCallAbsoluteCounter);
          if (callback) {
            callback();
          }
        }
      };
      existsTagResultHandler_ = function(recordset, callback) {
        console.log("existsTagResultHandler called");
        if (callback) {
          callbackRoot();
        }
        return console.log("Callback from existsTagResultHandler");
      };
      existsTagResultHandler = function(recordset, callback) {
        var insert, params, params2, params22, query, query_, tagId, update, utc;
        console.log("existsTagResultHandler called");
        tagId = 0;
        if ((recordset != null) && recordset.length > 0) {
          console.log("before - existsTagResultHandler - notes_tag - update");
          tagId = recordset.item(0).id;
          console.log("tagId is:");
          console.log(tagId);
          params2 = [moment(new Date()).unix(), tagId];
          update = "UPDATE notes_tag SET latestTime = ? WHERE id = ?";
          utc = moment(new Date()).unix();
          query = squel.update().table('notes_tag').setFields({
            "useCount: useCount + 1": void 0
          }).set('latestTime', utc).where('id = "' + tagId + '"').toParam();

          /*
          $cordovaSQLite.execute(db, query.text, query.values).then (data) ->
          
            console.log("existsTagResultHandler - notes_tag - update");
          
            updateUsedTagsCallRelativeCounter++
          
            callback() if callback
          
             *return
           */
          console.log("before - existsTagResultHandler - notes_tag - update - before transaction");
          databaseService.db.transaction(function(tx) {
            return tx.executeSql(query.text, query.values, (function(tx, result) {
              console.log(result);
              updateUsedTagsCallRelativeCounter++;
              return console.log("existsTagResultHandler - notes_tag - update");
            }), function(tx, error) {
              return console.log(error);
            });
          });
        } else {
          console.log("before - existsTagResultHandler - notes_tag - insert");

          /*
          recordset = data.rows
          
          tagId = recordset[0].id;
          
          
          console.log "tagId is:"
          console.log tagId
           */
          params = [];
          params[":createTime"] = moment(new Date()).unix();
          params2 = [userData, moment(new Date()).unix(), moment(new Date()).unix(), 1, "", ""];
          insert = 'INSERT INTO notes_tag(name, createTime, latestTime, useCount, pinyin, fpinyin) VALUES(?, ?, ?, ?, ?, ?)';
          utc = moment(new Date()).unix();
          query_ = squel.insert().into("notes_tag").set("name", userData).set("createTime", "utc").set("latestTime", "utc").set("useCount", 1).set("pinyin", "").set("fpinyin", "").toParam();
          $cordovaSQLite.execute(databaseService.db, query_.text, query_.values).then(function(data) {
            console.log("existsTagResultHandler - notes_tag - insert");
            return updateUsedTagsCallRelativeCounter++;
          });
          tagId = lastInsertRowID;
        }
        params22 = [tagId, lastInsertRowID];
        insert = 'INSERT INTO notes_tag_set(tagId, noteId) VALUES(?, ?)';
        query = squel.insert().into("notes_tag_set").set("tagId", tagId).set("noteId", lastInsertRowID).toParam();
        $cordovaSQLite.execute(databaseService.db, query.text, query.values).then(function(data) {
          console.log("existsTagResultHandler - notes_tag_set - insert");
          console.log('updateUsedTagsCallRelativeCounter is');
          console.log(updateUsedTagsCallRelativeCounter);
          updateUsedTagsCallAbsoluteCounter++;
          console.log('updateUsedTagsCallAbsoluteCounter is');
          console.log(updateUsedTagsCallAbsoluteCounter);
          if (callback) {
            callback();
          }
        });
      };

      /*
      private function dealGetTags():void
      		{
      			//var offset:int = (_pageNo - 1) * 30;
      			var offset:int = (_pageNo - 1) * 100;
      
      			//var token:SqliteDatabaseToken = _facade.documentDatabase.createCommandToken("SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT " + offset + ",30");
      
      			//working
      			//var token:SqliteDatabaseToken = _facade.documentDatabase.createCommandToken("SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT " + offset + ",100");
      
      			var params:Dictionary = new Dictionary();
      			params[":contentId"] = _provider;
      			var token:SqliteDatabaseToken = _facade.documentDatabase.createCommandToken("SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.content = :contentId AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT 100", params);
      
      			token.addEventListener(SqliteDatabaseEvent.RESULT, getTagsResultHandler);
      			token.addEventListener(SqliteDatabaseEvent.ERROR, getTagsErrorHandler);
      			token.start();
      		}
       */
      _pageNo = -1;
      _pageSize = -1;
      initGetTagsToken = function(pageNo) {
        return _pageNo = -1;
      };
      this.getTags = function() {
        var params2, query;
        params2 = ["facebook"];
        query = squel.select().from(squel.select().from('notes_tag'), 't').field('t.*').from(squel.select().from('notes_tag_set'), 'ts').field('ts.noteId', 'postCount').from(squel.select().from('notes'), 'n').where(squel.expr().and("t.id = ts.tagId").and("ts.noteId = n.id").and("n.content = 'facebook'").and("n.state <> 0")).group("ts.tagId").order("useCount", false).order("latestTime", false).limit(100).toString();
        return databaseService.db.transaction(function(tx) {
          return tx.executeSql(query, [], (function(tx, result) {
            var i, _i, _ref;
            for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
              console.log(result.rows.item(i));
            }
            console.log("result.rows.length");
            console.log(result.rows.length);
            console.log("dealGetTags");
          }), function(tx, error) {
            console.log(error);
          });
        });
      };

      /*
      public function initGetPostsWithTagToken(tag:Object, lastPost:Object = null, pageSize:int = 100, provider:String = null):void
      		{
      			_tagInfo = tag;
      			_postInfo = lastPost;
      			_pageSize = pageSize;
      
      			_provider = provider;
      
      			_dealFunc = dealGetPostsWithTag;
      		}
       */
      initGetPostsWithTagToken = function(tag, lastPost, pageSize, provider) {
        var _postInfo, _provider, _tagInfo;
        _tagInfo = tag;
        _postInfo = lastPost;
        _pageSize = pageSize;
        return _provider = provider;
      };
      dealGetPostsWithTag = function() {
        var condictionString, query;
        condictionString = "";
        if (_postInfo !== null) {
          condictionString += " AND modifyTime < (SELECT modifyTime FROM notes WHERE id=:id)";
        }
        query = squel.select().from('notes').field('id').field('title').field('modifyTime').field('content').field('color').field('selected').where(squel.expr().and("state = '1'").and("content = 'facebook'").and("';'||tags||';' like '%;'||';%'").and("modifyTime" < squel.select().from('notes').where("id = ?", _postInfo.id))).order("title", true).limit(0, 100).toString();
        return databaseService.db.transaction(function(tx) {
          return tx.executeSql(query, [], (function(tx, result) {
            var i, _i, _ref;
            for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
              console.log(result.rows.item(i));
            }
            console.log("result.rows.length");
            console.log(result.rows.length);
            return console.log("dealGetPostsWithTag");
          }), function(tx, error) {
            return console.log(error);
          });
        });

        /*
        var condictionString:String = "";
        			var params:Dictionary = new Dictionary();
        			params[":keyword"] = _tagInfo.id == 0 ? "" : _tagInfo.name;
        
        			//problem !!!
        			params[":contentId"] = _provider;
        
        			if (_postInfo != null)
        			{
        				params[":id"] = _postInfo.id;
        				condictionString += " AND modifyTime < (SELECT modifyTime FROM notes WHERE id=:id)";
        			}
         */
      };
      initGetUsedTagsToken = function() {
        return dealGetUsedTags();
      };
      dealGetUsedTags = function() {
        var query;
        query = squel.select().from('notes_tag').where(squel.expr().and("state = '1'").and("content = 'facebook'")).order("useCount", false).order("latestTime", false).limit(0, 10).toString();
        return databaseService.db.transaction(function(tx) {
          return tx.executeSql(query, [], (function(tx, result) {
            var i, _i, _ref;
            for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
              console.log(result.rows.item(i));
            }
            console.log("result.rows.length");
            console.log(result.rows.length);
            return console.log("dealGetUsedTags");
          }), function(tx, error) {
            return console.log(error);
          });
        });
      };
      initGetPostInfoToken = function(id, keyword) {
        var _id, _keyword;
        _id = id;
        return _keyword = keyword;
      };
      dealGetPostInfo = function() {
        var query;
        query = squel.select().from('notes').field('id').field('title').field('createTime').field('content').field('tags').field('color').field('selected').where(squel.expr().and("state = '1'").and("id = ?", _id)).toString();
        return databaseService.db.transaction(function(tx) {
          return tx.executeSql(query, [], (function(tx, result) {
            var i, _i, _ref;
            for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
              console.log(result.rows.item(i));
            }
            console.log("result.rows.length");
            console.log(result.rows.length);
            return console.log("dealGetUsedTags");
          }), function(tx, error) {
            return console.log(error);
          });
        });
      };
      initMaskPostColor = function(id, color) {
        var _color, _id;
        _id = id;
        return _color = color;
      };
      dealSetPostColor = function() {
        var query;
        query = squel.update().table('notes').set('color', _color).where('id = "' + _id + '"').toParam();
        return databaseService.db.transaction(function(tx) {
          return tx.executeSql(query.text, query.values, (function(tx, result) {
            var i, _i, _ref;
            for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
              console.log(result.rows.item(i));
            }
            console.log("result.rows.length");
            console.log(result.rows.length);
            return console.log("dealGetUsedTags");
          }), function(tx, error) {
            return console.log(error);
          });
        });
      };
      initMaskPostState = function(id, selected) {
        var _id, _selected;
        _id = id;
        return _selected = selected;
      };
      dealSetPostState = function() {
        var query;
        query = squel.update().table('notes').set('selected', _selected).where('id = "' + _id + '"').toParam();
        return databaseService.db.transaction(function(tx) {
          return tx.executeSql(query.text, query.values, (function(tx, result) {
            var i, _i, _ref;
            for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
              console.log(result.rows.item(i));
            }
            console.log("result.rows.length");
            console.log(result.rows.length);
            return console.log("dealGetUsedTags");
          }), function(tx, error) {
            return console.log(error);
          });
        });
      };
      _postInfo = void 0;
      _keyword = void 0;
      _color = -1;
      initGetLatestPostsToken = function(lastPost, pageSize, keyword, color) {
        _postInfo = lastPost;
        _pageSize = pageSize;
        _keyword = keyword;
        return _color = color;
      };
      dealGetLatestPosts = function() {
        var expr, query;
        expr = squel.expr();
        if (_keyword) {
          expr = expr.and("title like = ?", _keyword).or("content like = ?", _keyword).or("tags like = ?", _keyword);
        }
        if (_color !== 0xffffff && _color >= 0) {
          expr = expr.and("color = ?", _color);
        }
        if (_postInfo !== null) {
          expr.and("modifyTime < ?", squel.select().field('modifyTime').from('notes').where("id = ?", _id));
        }
        query = squel.select().from('notes').field('id').field('title').field('modifyTime').field('color').field('selected').where(expr.and("state = '1'").and("id = ?", _id)).order("title", true).limit(0, 100).toString();
        return databaseService.db.transaction(function(tx) {
          return tx.executeSql(query, [], (function(tx, result) {
            var i, _i, _ref;
            for (i = _i = 0, _ref = result.rows.length; _i <= _ref; i = _i += 1) {
              console.log(result.rows.item(i));
            }
            console.log("result.rows.length");
            console.log(result.rows.length);
            return console.log("dealGetUsedTags");
          }), function(tx, error) {
            return console.log(error);
          });
        });
      };
    }

    return AggregationRest;

  })();


  /*
  @setItemType = ->
    prevDate = null
  
    currentBalance = "0,00"
    aggregationModelService.globalTags.each (entity) ->
  
       *var curDate = entity.date;
      curDate = entity.name.charAt(0)
  
      if not prevDate? or (prevDate isnt curDate)
        prevDate = curDate
  
        formattedBalance = "0,00"
  
         *working
        aggregationModelService.resultTransactions.push
          uid: prevDate
          date: curDate
          balance: currentBalance
          formattedBalance: formattedBalance
          type: "dateHeader"
          sortByElement: curDate
  
      entity.type = "transaction"
  
      aggregationModelService.resultTransactions.push entity
   */

  module.exports = AggregationRest;

  angular.module('shared_view.module').service('aggregationRestService', ['Restangular', 'aggregationModelService', '$cordovaSQLite', 'DBSCHEMAS', 'databaseService', AggregationRest]);

  Database = (function() {
    function Database() {
      var lastInsertRowID, notes, notes_attach, notes_tag, notes_tag_set;
      this.db = void 0;
      notes = 'CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY, title TEXT, content TEXT, createTime DATETIME, modifyTime DATETIME, state INTEGER, tags TEXT, color INTEGER DEFAULT -1, selected INTEGER DEFAULT -1)';
      notes_attach = 'CREATE TABLE IF NOT EXISTS notes_attach(id INTEGER PRIMARY KEY, url TEXT, noteId INTEGER, createTime DATETIME)';
      notes_tag = 'CREATE TABLE IF NOT EXISTS notes_tag(id INTEGER PRIMARY KEY, name TEXT, createTime DATETIME, latestTime DATETIME, useCount INTEGER, pinyin TEXT, fpinyin TEXT, selected INTEGER DEFAULT -1)';
      notes_tag_set = 'CREATE TABLE IF NOT EXISTS notes_tag_set(tagId INTEGER, noteId INTEGER, FOREIGN KEY(tagId) REFERENCES notes_tag(id), FOREIGN KEY(noteId) REFERENCES notes(id))';
      lastInsertRowID = -1;
      this.connect = function() {
        if (window.openDatabase) {
          this.db = window.openDatabase('Millipede', '0.0', 'Storage quota test application', 5 * 1024 * 1024);
          this.initializeWebSqlDatabase();
        } else {
          console.log("Web DB not available");
          this.initializeSqlDatabase();
        }
        return this.db;
      };
      this.initializeSqlDatabase = function() {

        /*
        @db.run(DBSchemas.create.notes)
        
        @db.run(DBSchemas.create.notes_attach)
        
        @db.run(DBSchemas.create.notes_tag)
        
        @db.run(DBSchemas.create.notes_tag_set)
        
        @db.run(DBSchemas.create.rss_list)
        @db.run(DBSchemas.create.rss_items)
        @db.run(DBSchemas.create.subscripts)
         */
      };
      this.initializeWebSqlDatabase = function() {
        this.db.transaction(function(tx) {
          return tx.executeSql(notes, [], (function(tx, result) {
            return console.log(result);
          }), function(tx, error) {
            return console.log(error);
          });
        });
        this.db.transaction(function(tx) {
          return tx.executeSql(notes_attach, [], (function(tx, result) {
            return console.log(result);
          }), function(tx, error) {
            return console.log(error);
          });
        });
        this.db.transaction(function(tx) {
          return tx.executeSql(notes_tag, [], (function(tx, result) {
            return console.log(result);
          }), function(tx, error) {
            return console.log(error);
          });
        });
        return this.db.transaction(function(tx) {
          return tx.executeSql(notes_tag_set, [], (function(tx, result) {
            return console.log(result);
          }), function(tx, error) {
            return console.log(error);
          });
        });
      };
    }


    /*
    @instance: (=>
      instance = null
      =>
        instance = new @() if not instance
        instance
    )()
     */

    return Database;

  })();

  module.exports = Database;

  angular.module('shared_view.module').service('databaseService', [Database]);

  ProviderRestangular = (function() {
    function ProviderRestangular(RestangularProvider) {
      RestangularProvider.setBaseUrl('http://millipede.me:9001/');

      /*
      Restangular.withConfig (RestangularConfigurer) ->
        RestangularConfigurer.setBaseUrl "http://millipede.me:9001/"
       */
    }

    return ProviderRestangular;

  })();

  module.exports = ProviderRestangular;

  angular.module('shared_view.module').config(['RestangularProvider', ProviderRestangular]);

  SideMenu = (function() {
    function SideMenu($serviceScope) {
      var SideMenuInstance;
      return SideMenuInstance = (function() {
        var a;

        a = -1;

        function SideMenuInstance() {
          var $scope;
          $scope = $serviceScope();
          this.login = function() {
            $scope.$emit("logged-in");
          };
        }

        return SideMenuInstance;

      })();
    }

    return SideMenu;

  })();


  /*
  class SideMenu extends Factory
    constructor: ($serviceScope) ->
      return {
  
        $scope = $serviceScope
  
        login: ->
  
           * Can trigger events on scopes
          $scope.$emit "logged-in"
          
          return
  
      }
   */


  /*
  class SideMenu extends Service
  
    constructor: () ->
  
     *constructor: ($cordovaCamera, $cordovaContacts, GalleryService, $cordovaDevice) ->
   */

  module.exports = SideMenu;

  angular.module('shared_view.module').factory('SideMenu', ['$serviceScope', SideMenu]);

}).call(this);

//# sourceMappingURL=view-shared.js.map
