async = require 'async'
squel = require 'squel'



class AggregationRest

  constructor: (Restangular, aggregationModelService, $cordovaSQLite, DBSCHEMAS, databaseService) ->
  #constructor: (ProviderRestangular, Restangular, aggregationModelService, $cordovaSQLite, DBSCHEMAS, databaseService) ->
  #constructor: (aggregationModelService, providerRestangularService, $cordovaSQLite, DBSCHEMAS, databaseService) ->
  #constructor: (aggregationModelService, ProviderRestangular, $cordovaSQLite, DBSCHEMAS, databaseService) ->

    userData = undefined

    @getTags__ = ->

      ###

      var offset:int = (_pageNo - 1) * 100;

			//var token:SqliteDatabaseToken = _facade.documentDatabase.createCommandToken("SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT " + offset + ",30");

			//working
			//var token:SqliteDatabaseToken = _facade.documentDatabase.createCommandToken("SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT " + offset + ",100");

			var params:Dictionary = new Dictionary();
			params[":contentId"] = _provider;
			var token:SqliteDatabaseToken = _facade.documentDatabase.createCommandToken("SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.content = :contentId AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT 100", params);


      ###

      ### out - background db
      if databaseService.db == undefined
        databaseService.connect()
      ###

      # "SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.content = :contentId AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT 100", params);

      params2 = ["facebook"]

      #$cordovaSQLite.execute(db, 'SELECT * FROM notes', []).then (data) ->
      $cordovaSQLite.execute(databaseService.db, 'SELECT * FROM notes_tag', []).then (data) ->
      #$cordovaSQLite.execute(db, "SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.content = ? AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT 100", params2).then (data) ->

        i = 0

        while i < data.rows.length
          #$scope.result = data.rows.item(i)
          result = data.rows.item(i)

          #console.log $scope.result
          console.log result

          i++
        return

    @imported = false

    @getUsers = (type, callback) ->

      window.localStorage.setItem "state", "first"

      ### out - background db
      if databaseService.db == undefined
        databaseService.connect()
      ###

      ###
      if databaseService.db == undefined
        databaseService.db = db
      ###

      #ProviderRestangular.one("friends").customPOST(JSON.stringify({}), "", {},
      #providerRestangularService.one("friends").customPOST(JSON.stringify({}), "", {},

      Restangular.one('friends').customPOST(JSON.stringify({}), "", {},

        "Content-Type": "application/json"
        "providerId": "facebook"
        "apikey": "markus.gritsch.5"

      ).then (result) ->


        kango.addMessageListener(("persistenceBack2FrontConcrete"), (event) ->

            console.log 'persistenceBack2FrontConcrete - database transport'

            debugger

            callback() if callback

        );

        kango.dispatchMessage('persistenceFront2BackConcrete', {'method': 'getUsers', 'dataObject': result.socialFriends});


        #async.forEachSeries result.socialFriends, preProcess, ->

        ### out handled in background script
        async.forEachSeries result.socialFriends, preProcess, (err) ->

          console.log "Error in preProcess"?

          callback() if callback
        ###

    preProcess = (socialFriend, callback) ->

      name = ""
      firstName = ""
      lastName = ""

      email = ""

      groupList = null

      if socialFriend.fullName is undefined or socialFriend.fullName is null
        name = ""
      else
        name = (socialFriend.fullName).capitalize(true)

      if socialFriend.firstName is undefined or socialFriend.firstName is null
        firstName = ""
      else
        firstName = (socialFriend.firstName).capitalize(true)

      if socialFriend.lastName is undefined or socialFriend.lastName is null
        lastName = ""
      else
        lastName = (socialFriend.lastName).capitalize(true)

      if socialFriend.email is undefined or socialFriend.email is null
        email = ""
      else
        email = (socialFriend.email).capitalize(true)

      if socialFriend.groupList is undefined or socialFriend.groupList is null
        groupList = array()
      else
        groupList = array(socialFriend.groupList)

      account =

        name: name

        firstName: firstName

        lastName: lastName

        email: email

        groupList: groupList

        type: "1"
        startBalance: "1"
        insertDate: "1"
        startDate: "1"
        description: "1"
        synchDate: "1"
        visible: "1"
        importColumnsOrder: "1"
        importDateFormat: "1"
        uid: "1"
        bankAccountUID: "1"
        transferToBankAccountUID: "2"
        transferAmount: "10"
        insertDate: new Date()
        date: new Date()
        description: ""
        tagColor: ""

        #uid: "10",
        amount: 5.56789
        totalAmount: 5.56789
        category: "Social Networks"
        entity: "Counter 0"

        item:
          categoriesInTransaction:
            categoryUID: "100"
            transactionUID: "101"
            amount: 5.56789
            synchDate: new Date()
            deleted: false

      account.name = account.firstName.concat(" ").concat(account.lastName)  if account.firstName isnt "" and account.lastName isnt ""  if account.name is ""

      #socialFriend.fullName = "Undefined";
      account.name = account.email  if account.name is ""

      #if (tiTitle.text == "")
      if account.name is ""
        #_facade.alert("请输入标题!");
      else
        if account.groupList.length is 0

          tags = null
          tags = ""
          tags = tags.concat("Unorganized")

          currentEntity = null

          aggregationModelService.globalTags.each (entity) ->
            currentEntity = entity  if entity.name is "Unorganized"
            return

          unless currentEntity?

            children = array()
            children.push account
            element = #[

              id: aggregationModelService.globalTags.length
              parent: null
              name: "Unorganized"
              canSelect: true
              children: children
              insertDate: new Date()
              date: new Date()
              amount: 5.56789
              totalAmount: 5.56789
              item:
                insertDate: new Date()
                date: new Date()

            aggregationModelService.globalTags.push element
          else
            currentEntity.children.push account

          account.tags = tags

          importFriends account, callback

        else

          tags = null
          tags = ""
          groupListLenght = account.groupList.length

          j = 0
          groupListLen = groupListLenght

          while j < groupListLen
            tags = tags.concat(account.groupList[j])
            currentEntity = null

            aggregationModelService.globalTags.each (entity) ->
              currentEntity = entity  if entity.name is account.groupList[j]
              return

            unless currentEntity?

              children = array()
              children.push account
              element =

                id: aggregationModelService.globalTags.length
                parent: null
                name: account.groupList[j]
                canSelect: true
                children: children
                insertDate: new Date()
                date: new Date()
                amount: 5.56789
                totalAmount: 5.56789
                item:
                  insertDate: new Date()
                  date: new Date()

              aggregationModelService.globalTags.push element
            else
              currentEntity.children.push account
            tags = tags.concat(";")  if j < (groupListLenght - 1)
            j++

          account.tags = tags

          importFriends account, callback

      aggregationModelService.globalTags.sort "name", "ascending"

      #setItemType

      #aggregationModelService.resultTransactions = aggregationModelService.globalTags

      #make them persistent

      #window.localStorage.setItem "resultTransactions", aggregationModelService.resultTransactions

    preProcess_ = (socialFriend, callback) ->
      ###
      fs.exists dirName, (exists) ->
        unless exists
          callback() if callback
          return
        fs.remove dirName, (error) ->
          callback() if callback
      ###

      console.log socialFriend

      if socialFriend.groupList.length is 0
        _tags = null
        _tags = ""
        _tags = _tags.concat("Unorganized")

        socialFriend.tags = _tags

        importFriends socialFriend, callback

      else
        _tags = null
        _tags = ""

        for i in [0..socialFriend.groupList.length] by 1

          _tags = _tags.concat(socialFriend.groupList[i])

          if i < (socialFriend.groupList.length - 1)
            _tags = _tags.concat(";")

        socialFriend.tags = _tags

        importFriends socialFriend, callback

      #callback() if callback

    preProcess2 = (globalTag, callback) ->
      console.log "globalTag is"

      #query = squel.select().from("notes_tag").where("name = ?", globalTag.name).toString()
      query = squel.select().from("notes_tag").where('name = "' + globalTag.name + '"').toString()

      #$cordovaSQLite.execute(db, query, []).then (data) ->
      $cordovaSQLite.execute(databaseService.db, query, []).then (data) ->

        console.log("data.insertId is");
        console.log(data.insertId);

        #existsTagResultHandler data.rows, callback

      userData = globalTag;
      #userData = globalTag.name;

      callback() if callback

    @getUsersFromLocalDB = (callback) ->

      ###
      async.forEachSeries socialFriends, cleanDir, ->
        callback() if callback
      ###

      ### out - background db
      if databaseService.db == undefined
        databaseService.connect()
      ###

      $cordovaSQLite.execute(databaseService.db, 'SELECT * FROM notes', []).then (data) ->
      #$cordovaSQLite.execute(db, 'SELECT * FROM notes_tag', []).then (data) ->

        i = 0

        while i < data.rows.length
          result = data.rows.item(i)

          console.log result

          i++
        return


    #db = undefined

    lastInsertRowID = -1

    ###
    connect = ->
      devicePath = if $cordovaDevice.getPlatform() == "iOS" then steroids.app.path else steroids.app.absolutePath
      dbPath =  devicePath + "/data/database";
      #db = $cordovaSQLite.openDB(dbPath)
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
    ###

    expectedDBCallbacks = 0
    dbCheckIntervalId = 0

    ###
    importFriends = (account, index, count) ->

      date = new Date();
      params2 = [account.name, "facebook", date.toUTCString(), date.toUTCString(), 1, account.tags]

      insert = 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(?, ?, ?, ?, ?, ?)'

      db.transaction (tx) ->
        tx.executeSql insert, params2, successInsert, failureInsert

        #tx.executeSql "INSERT INTO mytable (thing) VALUES (" + i + ")", [], successInsert, failureInsert
        expectedDBCallbacks++
    ###

    ###
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
    ###



    #successInsert = ->
    successInsert = (tx, result) ->
      expectedDBCallbacks--

      #lastInsertRowID = data.insertId

      updateUsedTags()

      return

    #failureInsert = (e) ->
    failureInsert = (tx, error) ->
      expectedDBCallbacks--

      console.log "failureInsert"

      return

    dbCheck = ->
      if expectedDBCallbacks is 0
        clearInterval dbCheckIntervalId
        allDone()
      return

    ###
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
    ###

    importFriends = (account, callback) ->

      date = new Date();

      #params2 = [account.name, "facebook", date.toUTCString(), date.toUTCString(), 1, account.groupList]
      params2 = [account.name, "facebook", date.toUTCString(), date.toUTCString(), 1, account.tags]


      #insert = 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(:title, :content, :createTime, :modifyTime, 1, :tags)'
      #insert = 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(:title, :content, :createTime, :modifyTime, 1, :tags)'
      insert = 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(?, ?, ?, ?, ?, ?)'

      query = squel.insert().into("notes").set("title", account.name).set("content", "facebook").set("createTime", date.toUTCString()).set("modifyTime", date.toUTCString()).set("state", 1).set("tags", account.tags).toParam()

      #$cordovaSQLite.execute(db, DBSCHEMAS.insert.notes, params)
      #$cordovaSQLite.execute(db, insert, params.items) #.then (data) ->
      #$cordovaSQLite.execute(db, insert, params2).then (data) ->

      $cordovaSQLite.execute(databaseService.db, query.text, query.values).then (data) ->

        lastInsertRowID = data.insertId

        console.log("lastInsertRowID is");
        console.log(lastInsertRowID);

        updateUsedTags(callback)

        #callback() if callback

        ###
        var post:Object = new Object();
        post.id = _id;
        post.title = _title;
        post.modifyTime = new Date();
        post.tags = _tags;
        ###

        return

      return

    #@updateUsedTags = ->
    #updateUsedTags = ->

    updateUsedTagsCallRelativeCounter = 0
    updateUsedTagsCallAbsoluteCounter = 0

    updateUsedTags = (callback) ->

      #updateUsedTagsCallRelativeCounter++

      #updateUsedTagsCallRelativeCounter = updateUsedTagsCallRelativeCounter + aggregationModelService.globalTags.length

      if aggregationModelService.globalTags != null && aggregationModelService.globalTags.length > 0

        #async.forEachSeries aggregationModelService.globalTags, preProcess2, ->
        ###
        async.forEachSeries aggregationModelService.globalTags, preProcess2, (err) ->

          console.log "Error in preProcess2"?

          callback() if callback
        ###

        pkey = "name"
        async.forEachSeries aggregationModelService.globalTags, (globalTag, callback) ->

          #query = squel.select().from("notes_tag").where("name = ?", globalTag.name).toString()
          #query = squel.select().from("notes_tag").where('name = "' + globalTag.name + '"').toString()

          #query = squel.select().from("notes_tag").where('name = "' + globalTag.name + '"').toString();
          #query = squel.select().from("notes_tag").where('name = "' + 'TSV Oberschneiding' + '"').toString();


          #TODO: 'name = TSV Oberschneiding' String formating
          #query = squel.select().from("notes_tag").where('name = TSV Oberschneiding').toString();
          #query = squel.select().from("notes_tag").where('name = Familiy').toString();


          params2 = [globalTag.name]
          #query = "SELECT * FROM notes_tag WHERE name = ?"
          query = "SELECT * FROM notes_tag WHERE name = ?"

          #query = SELECT last_insert_rowid() FROM notes_tag
          queryLastRowID = "SELECT last_insert_rowid() FROM notes_tag"

          ###
          $cordovaSQLite.execute(db, queryLastRowID, []).then (data) ->
            console.log "Last Row ID:"
            console.log data
          ###

          #console.log "Last Row ID:"
          #console.log(db.last_insert_rowid())


          databaseService.db.transaction (tx) ->
            tx.executeSql query, params2, ((tx, result) ->

              console.log result

              #existsTagResultHandler result, callback
              existsTagResultHandler result.rows, callback

            ), (tx, error) ->

              console.log error

          ###
          #$cordovaSQLite.execute(db, query, []).then (data) ->
          $cordovaSQLite.execute(db, query, params2).then (data) ->
          #$cordovaSQLite.execute(db, query.text, query.values).then (data) ->

            #console.log("data.insertId is");
            #console.log(data.insertId);

            console.log("data.insertId is");
            console.log data

            i = 0

            while i < data.rows.length
              #$scope.result = data.rows.item(i)
              result = data.rows.item(i)

              #console.log $scope.result
              console.log result

              i++

            #existsTagResultHandler data.rows, callback
            existsTagResultHandler data, callback

          ###

          #userData = globalTag;
          userData = globalTag.name;


          ###
          console.log 'updateUsedTagsCallRelativeCounter is'
          console.log updateUsedTagsCallRelativeCounter

          updateUsedTagsCallAbsoluteCounter++

          console.log 'updateUsedTagsCallAbsoluteCounter is'
          console.log updateUsedTagsCallAbsoluteCounter

          callback() if callback
          ###

          return

        , (err) ->

          console.log "Error in inline preProcess2"?

          callback() if callback


        ###
        aggregationModelService.globalTags.each (tagName) ->

          #params = []
          params = new dictionary()
          params[":name"] = tagName.name

          params2 = [tagName.name]

          #$cordovaSQLite.execute(db, DBSCHEMAS.select.notes, []).then (data) ->
          #$cordovaSQLite.execute(db, 'SELECT * FROM notes_tag WHERE name = :name', params).then (data) ->

          #query = squel.select().from("notes_tag").where("name = ?", tagName.name).toString()
          query = squel.select().from("notes_tag").where('name = "' + tagName.name + '"').toString()

          #$cordovaSQLite.execute(db, 'SELECT * FROM notes_tag WHERE name = ?', params2).then (data) ->
          $cordovaSQLite.execute(db, query, []).then (data) ->

            console.log("data.insertId is");
            console.log(data.insertId);

            existsTagResultHandler data.rows, callback
            #existsTagResultHandler(callback)

            return


          userData = tagName;
          #userData = tagName.name;
        ###

      else

        console.log 'updateUsedTagsCallRelativeCounter is'
        console.log updateUsedTagsCallRelativeCounter

        updateUsedTagsCallAbsoluteCounter++

        console.log 'updateUsedTagsCallAbsoluteCounter is'
        console.log updateUsedTagsCallAbsoluteCounter

        callback() if callback

      return

    existsTagResultHandler_ = (recordset, callback) ->
      console.log "existsTagResultHandler called"

      callbackRoot() if callback

      console.log "Callback from existsTagResultHandler"

    existsTagResultHandler = (recordset, callback) ->
    #existsTagResultHandler = (data, callback) ->

      console.log "existsTagResultHandler called"

      tagId = 0

      #if(recordset != null && recordset.length > 0)
      if recordset? and recordset.length > 0
      #if !(data.insertId == undefined)

        console.log("before - existsTagResultHandler - notes_tag - update");

        #recordset = data.rows


        #row = results.rows.item(i);
        #string = string + row['name'] + " (ID "+row['id']+")\n";


        tagId = recordset.item(0).id;


        console.log "tagId is:"
        console.log tagId

        params2 = [moment(new Date()).unix(), tagId]

        #update = 'UPDATE notes_tag SET useCount = useCount + 1, latestTime = :latestTime WHERE id = :id'
        update = "UPDATE notes_tag SET latestTime = ? WHERE id = ?"

        #update = 'UPDATE notes_tag SET useCount = useCount + 1, latestTime = ? WHERE id = ?'

        utc = moment(new Date()).unix();

        query = squel.update()
        .table('notes_tag')

        .setFields({
            "useCount: useCount + 1": undefined
        })

        #.set("useCount = useCount + 1")

        .set('latestTime', utc)
        #.where('id = "' + tagId + '"').toString()
        .where('id = "' + tagId + '"').toParam()

        #updateUsedTagsCallRelativeCounter++

        #$cordovaSQLite.execute(db, update, params).then (data) ->
        #$cordovaSQLite.execute(db, update, params2).then (data) ->
        #$cordovaSQLite.execute(db, query, []).then (data) ->
        ###
        $cordovaSQLite.execute(db, query.text, query.values).then (data) ->

          console.log("existsTagResultHandler - notes_tag - update");

          updateUsedTagsCallRelativeCounter++

          callback() if callback

          #return
        ###

        console.log("before - existsTagResultHandler - notes_tag - update - before transaction");

        databaseService.db.transaction (tx) ->
          tx.executeSql query.text, query.values, ((tx, result) ->
          #tx.executeSql update, params2, ((tx, result) ->

            console.log result

            updateUsedTagsCallRelativeCounter++

            #callback() if callback

            console.log("existsTagResultHandler - notes_tag - update");

          ), (tx, error) ->

            console.log error

      else

        console.log("before - existsTagResultHandler - notes_tag - insert");

        ###
        recordset = data.rows

        tagId = recordset[0].id;


        console.log "tagId is:"
        console.log tagId
        ###

        params = []

        #params[":name"] = token.userData;
        params[":createTime"] = moment(new Date()).unix();

        #params[":latestTime"] = params[":createTime"];
        #params[":pinyin"] = Chinese2Spell.makeSpellCode(token.userData, 0);
        #params[":fpinyin"] = Chinese2Spell.makeSpellCode(token.userData, SpellOptions.FirstLetterOnly);

        params2 = [userData, moment(new Date()).unix(), moment(new Date()).unix(), 1, "", ""]

        #insert = 'INSERT INTO notes_tag(name, createTime, latestTime, useCount, pinyin, fpinyin) VALUES(:name, :createTime, :latestTime, 1, :pinyin, :fpinyin)'
        insert = 'INSERT INTO notes_tag(name, createTime, latestTime, useCount, pinyin, fpinyin) VALUES(?, ?, ?, ?, ?, ?)'

        #query = squel.insert().into("notes_tag").set("name", userData.name).set("createTime", moment(new Date()).unix()).set("latestTime", moment(new Date()).unix()).set("useCount", 1).set("pinyin", "").set("fpinyin", "").toParam()

        utc = moment(new Date()).unix()

        query_ = squel.insert().into("notes_tag").set("name", userData).set("createTime", "utc").set("latestTime", "utc").set("useCount", 1).set("pinyin", "").set("fpinyin", "").toParam()

        #updateUsedTagsCallRelativeCounter++

        #$cordovaSQLite.execute(db, insert, params2).then (data) ->
        $cordovaSQLite.execute(databaseService.db, query_.text, query_.values).then (data) ->

          console.log("existsTagResultHandler - notes_tag - insert");

          updateUsedTagsCallRelativeCounter++


          #callback() if callback

          #return

        tagId = lastInsertRowID

      #tagId = lastInsertRowID

      params22 = [tagId, lastInsertRowID]

      #insert 'INSERT INTO notes_tag_set(tagId, noteId) VALUES(:tagId, :noteId)'

      insert = 'INSERT INTO notes_tag_set(tagId, noteId) VALUES(?, ?)'

      query = squel.insert().into("notes_tag_set").set("tagId", tagId).set("noteId", lastInsertRowID).toParam()

      #$cordovaSQLite.execute(db, insert, params22).then (data) ->
      $cordovaSQLite.execute(databaseService.db, query.text, query.values).then (data) ->

        console.log("existsTagResultHandler - notes_tag_set - insert");


        #updateUsedTagsCallRelativeCounter++

        console.log 'updateUsedTagsCallRelativeCounter is'
        console.log updateUsedTagsCallRelativeCounter

        updateUsedTagsCallAbsoluteCounter++

        console.log 'updateUsedTagsCallAbsoluteCounter is'
        console.log updateUsedTagsCallAbsoluteCounter


        callback() if callback


        return

      return


    ###
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
    ###

    _pageNo = -1
    _pageSize = -1

    initGetTagsToken = (pageNo) ->
      _pageNo = -1

    #dealGetTags = ->

    @getTags = ->

      #"SELECT t.*, ts.noteId AS "postCount" FROM (SELECT * FROM notes_tag) `t`, (SELECT * FROM notes_tag_set) `ts`, (SELECT * FROM notes) `n` WHERE (t.id = ts.tagId AND ts.noteId = n.id AND n.content = facebook)"
      #"SELECT t.*,COUNT(ts.noteId) as postCount FROM notes_tag t,notes_tag_set ts,notes n WHERE t.id = ts.tagId AND ts.noteId = n.id AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT " + offset + ",100"

      params2 = ["facebook"]

      query = squel.select()

      .from( squel.select().from('notes_tag'), 't' )
      .field('t.*')

      .from( squel.select().from('notes_tag_set'), 'ts' )
      .field('ts.noteId', 'postCount')

      .from( squel.select().from('notes'), 'n' )

      #.field('t.*')
      #.field('ts.noteId', 'postCount')

      #.where("t.id = ts.tagId AND ts.noteId = n.id AND n.content = ? AND n.state <> 0 GROUP BY ts.tagId HAVING COUNT(ts.noteId) > 0 ORDER BY useCount DESC, latestTime DESC LIMIT 100")
      #.where("t.id = ts.tagId AND ts.noteId = n.id AND n.content = ?")
      #.where("t.id = ts.tagId AND ts.noteId = n.id")

      .where(
        #squel.expr().and("t.id = ts.tagId").and("ts.noteId = n.id").and("n.content = ?")
        squel.expr().and("t.id = ts.tagId").and("ts.noteId = n.id").and("n.content = 'facebook'").and("n.state <> 0")

        #.group("ts.tagId")

        #.order("useCount", false)
        #.order("latestTime", false)

        #.limit(100)
      )

      .group("ts.tagId")

      .order("useCount", false)
      .order("latestTime", false)


      .limit(100)

      #.toParam()
      .toString()

      databaseService.db.transaction (tx) ->
        #tx.executeSql query.text, query.values, ((tx, result) ->
        tx.executeSql query, [], ((tx, result) ->
          #tx.executeSql update, params2, ((tx, result) ->
          for i in [0..result.rows.length] by 1
            console.log result.rows.item(i)

          console.log "result.rows.length"
          console.log result.rows.length

          console.log "dealGetTags"

          return

        ), (tx, error) ->

          console.log error

          return


    ###
    public function initGetPostsWithTagToken(tag:Object, lastPost:Object = null, pageSize:int = 100, provider:String = null):void
		{
			_tagInfo = tag;
			_postInfo = lastPost;
			_pageSize = pageSize;

			_provider = provider;

			_dealFunc = dealGetPostsWithTag;
		}
    ###

    initGetPostsWithTagToken = (tag, lastPost, pageSize, provider) ->

      _tagInfo = tag;
      _postInfo = lastPost;
      _pageSize = pageSize;

      _provider = provider;

      #_dealFunc = dealGetPostsWithTag;

    dealGetPostsWithTag = ->

      condictionString = ""

      if (_postInfo != null)

        #params[":id"] = _postInfo.id;
        condictionString += " AND modifyTime < (SELECT modifyTime FROM notes WHERE id=:id)";

        #"SELECT id,title,modifyTime,content,color,selected FROM notes WHERE state = 1 AND content = :contentId AND ';'||tags||';' like '%;'||:keyword||';%'" + condictionString + " ORDER BY title ASC LIMIT 0," + _pageSize.toString(), params

      query = squel.select()

      .from('notes')

      .field('id')
      .field('title')
      .field('modifyTime')
      .field('content')
      .field('color')
      .field('selected')

      .where(
        #squel.expr().and("state = '1'").and("content = 'facebook'").and("';'||tags||';' like '%;'||:keyword||';%'").and("modifyTime" < squel.select().from('notes').where("id = ?", _postInfo.id))
        squel.expr().and("state = '1'").and("content = 'facebook'").and("';'||tags||';' like '%;'||';%'").and("modifyTime" < squel.select().from('notes').where("id = ?", _postInfo.id))
      )

      .order("title", true)

      .limit(0, 100)

      #.toParam()
      .toString()

      databaseService.db.transaction (tx) ->
        #tx.executeSql query.text, query.values, ((tx, result) ->
        tx.executeSql query, [], ((tx, result) ->
          #tx.executeSql update, params2, ((tx, result) ->


          for i in [0..result.rows.length] by 1
            console.log result.rows.item(i)

          console.log "result.rows.length"
          console.log result.rows.length

          console.log "dealGetPostsWithTag"

        ), (tx, error) ->

          console.log error

      ###
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
      ###

    initGetUsedTagsToken = ->
      dealGetUsedTags()

    dealGetUsedTags = ->
      #"SELECT * FROM notes_tag ORDER BY useCount DESC, latestTime DESC LIMIT 0,10"

      query = squel.select()

      .from('notes_tag')

      .where(
        squel.expr().and("state = '1'").and("content = 'facebook'") #.and("n.state <> 0")
      )

      .order("useCount", false)
      .order("latestTime", false)

      .limit(0, 10)

      #.toParam()
      .toString()

      databaseService.db.transaction (tx) ->
        #tx.executeSql query.text, query.values, ((tx, result) ->
        tx.executeSql query, [], ((tx, result) ->
          #tx.executeSql update, params2, ((tx, result) ->


          for i in [0..result.rows.length] by 1
            console.log result.rows.item(i)

          console.log "result.rows.length"
          console.log result.rows.length

          console.log "dealGetUsedTags"

        ), (tx, error) ->

          console.log error


    initGetPostInfoToken = (id, keyword) ->
      _id = id
      _keyword = keyword

    dealGetPostInfo = ->
      #"SELECT id,title,createTime,content,tags,color,selected FROM notes WHERE state = 1 AND id = :postId"

      query = squel.select()

      .from('notes')

      .field('id')
      .field('title')
      .field('createTime')
      .field('content')
      .field('tags')
      .field('color')
      .field('selected')

      .where(
        squel.expr().and("state = '1'").and("id = ?", _id)
      )

      #.toParam()
      .toString()

      databaseService.db.transaction (tx) ->
        #tx.executeSql query.text, query.values, ((tx, result) ->
        tx.executeSql query, [], ((tx, result) ->
          #tx.executeSql update, params2, ((tx, result) ->


          for i in [0..result.rows.length] by 1
            console.log result.rows.item(i)

          console.log "result.rows.length"
          console.log result.rows.length

          console.log "dealGetUsedTags"

        ), (tx, error) ->

          console.log error

    initMaskPostColor = (id, color) ->

      _id = id
      _color = color

    dealSetPostColor = ->
      #UPDATE notes SET color = :color WHERE id = :postId

      query = squel.update()
      .table('notes')

      .set('color', _color)

      .where('id = "' + _id + '"')

      .toParam()

      databaseService.db.transaction (tx) ->
        tx.executeSql query.text, query.values, ((tx, result) ->
          #tx.executeSql update, params2, ((tx, result) ->


          for i in [0..result.rows.length] by 1
            console.log result.rows.item(i)

          console.log "result.rows.length"
          console.log result.rows.length

          console.log "dealGetUsedTags"

        ), (tx, error) ->

          console.log error

    initMaskPostState = (id, selected) ->
      _id = id
      _selected = selected

    dealSetPostState = ->
      #"UPDATE notes SET selected = :selected WHERE id = :postId", params

      query = squel.update()
      .table('notes')

      .set('selected', _selected)

      .where('id = "' + _id + '"')

      .toParam()

      databaseService.db.transaction (tx) ->
        tx.executeSql query.text, query.values, ((tx, result) ->
          #tx.executeSql update, params2, ((tx, result) ->


          for i in [0..result.rows.length] by 1
            console.log result.rows.item(i)

          console.log "result.rows.length"
          console.log result.rows.length

          console.log "dealGetUsedTags"

        ), (tx, error) ->

          console.log error


    _postInfo = undefined
    _keyword = undefined
    _color = -1

    #initGetLatestPostsToken(lastPost:Object = null, pageSize:Number = 10, keyword:String = null, color:uint = 0xffffff):void
    initGetLatestPostsToken = (lastPost, pageSize, keyword, color) ->

      _postInfo = lastPost
      _pageSize = pageSize
      _keyword = keyword
      _color = color

    dealGetLatestPosts = ->
      #conditionString = "";

      expr = squel.expr()

      if _keyword
        #conditionString = "AND (title like '%'||:keyword||'%' OR content like '%'||:keyword||'%' OR  ';'||tags||';' like '%;'||:keyword||';%')"
        expr = expr.and("title like = ?", _keyword).or("content like = ?", _keyword).or("tags like = ?", _keyword)

      if _color != 0xffffff && _color >= 0
        #conditionString += "AND color = :color";
        expr = expr.and("color = ?", _color)

      if _postInfo != null
        #conditionString += "AND modifyTime < (SELECT modifyTime FROM notes WHERE id = :id)"

        #modifyTime = squel.select().field('modifyTime').from('notes').where("id = ?", _id) #.where('id = "' + _id + '"'))
        #expr.and("modifyTime < ?", modifyTime)
        expr.and("modifyTime < ?", squel.select().field('modifyTime').from('notes').where("id = ?", _id))

      #"SELECT id,title,modifyTime,color,selected FROM notes WHERE state = 1 " + conditionString + " ORDER BY title ASC LIMIT 0," + _pageSize.toString(), params

      query = squel.select()

      .from('notes')

      .field('id')
      .field('title')
      .field('modifyTime')
      .field('color')
      .field('selected')

      .where(
        #squel.expr().and("state = '1'").and("id = ?", _id).expr()
        expr.and("state = '1'").and("id = ?", _id)
      )

      .order("title", true)

      .limit(0, 100)

      #.toParam()
      .toString()

      databaseService.db.transaction (tx) ->
        #tx.executeSql query.text, query.values, ((tx, result) ->
        tx.executeSql query, [], ((tx, result) ->
          #tx.executeSql update, params2, ((tx, result) ->


          for i in [0..result.rows.length] by 1
            console.log result.rows.item(i)

          console.log "result.rows.length"
          console.log result.rows.length

          console.log "dealGetUsedTags"

        ), (tx, error) ->

          console.log error






###
@setItemType = ->
  prevDate = null

  currentBalance = "0,00"
  aggregationModelService.globalTags.each (entity) ->

    #var curDate = entity.date;
    curDate = entity.name.charAt(0)

    if not prevDate? or (prevDate isnt curDate)
      prevDate = curDate

      formattedBalance = "0,00"

      #working
      aggregationModelService.resultTransactions.push
        uid: prevDate
        date: curDate
        balance: currentBalance
        formattedBalance: formattedBalance
        type: "dateHeader"
        sortByElement: curDate

    entity.type = "transaction"

    aggregationModelService.resultTransactions.push entity
###

#module.exports = AggregationRest


angular.module('shared_view.module')
.service('aggregationRestService', ['Restangular', 'aggregationModelService', '$cordovaSQLite', 'DBSCHEMAS', 'databaseService', AggregationRest])