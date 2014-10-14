async = require 'async'
squel = require 'squel'

class AggregationModel extends Service

  constructor: (DBSCHEMAS, databaseService) ->

    @globalTags = array()

    resultTransactions = array()
    items = {}

    dataLoaded = false

    @currentNode = undefined
    @state = 'initial'

    @processResultTransactions = (filterOn, callback)->

      if databaseService.db == undefined
        databaseService.connect()

      #if(!dataLoaded)

      ###
      async.series([

          dealGetTags
          process

          #dealGetTags(callback)
          #process(filterOn, callback)
        ],
        callback(items))
      ###

      #async.series [dealGetTags, process], done

      ###
      async.series [
        (cb) -> dealGetTags cb
        (cb) -> process cb
      ], callback
      ###

      ###
      async.series [
        (callback) ->

          dealGetTags callback

          # do some stuff ...
          #callback null, "one"
        (callback) ->

          process callback

          # do some more stuff ...
          #callback null, "two"

      # optional callback
      ], (err, results) ->

        if err
          console.log err

        if results
          console.log results
      ###

      dealGetTags callback

      #dataLoaded = true

      items

    dealGetTags = (callback) ->
    #dealGetTags = ->

      #new check it
      resultTransactions = array()
      items = {}

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

          #for i in [0...result.rows.length] by 1
          for i in [0 ... result.rows.length]
            resultTransactions.push result.rows.item(i)

          console.log "dealGetTags"

          process callback

        ), (tx, error) ->

          console.log error

      #callback null, "one" if callback

    process = (callback) ->

      debugger

    #process = (filterOn, callback) ->
    #process = (filterOn) ->

      firstLetter = undefined

      i = 0

      while i < resultTransactions.length

        #firstLetter = resultTransactions[i][filterOn].substring(0, 1).toUpperCase()
        firstLetter = resultTransactions[i]['name'].substring(0, 1).toUpperCase()
        items[firstLetter] = []  unless items[firstLetter]

        #@items[firstLetter].push @resultTransactions[i][filterOn]
        items[firstLetter].push resultTransactions[i]

        i++

      #@items

      #cb(items) if cb
      #callback null, items if callback

      callback items if callback

    #process2 = (filterOn, callback) ->
    process2 = (callback) ->

      firstLetter = undefined

      i = 0

      while i < resultTransactions.length

        firstLetter = resultTransactions[i]['title'].substring(0, 1).toUpperCase()

        console.log firstLetter

        #firstLetter = firstLetter.concat(randomString())
        #console.log firstLetter

        items[firstLetter] = []  unless items[firstLetter]

        #@items[firstLetter].push @resultTransactions[i][filterOn]
        items[firstLetter].push resultTransactions[i]

        i++

      ###
      for value, index in items
        element = JSON.parse(value);
      ###

      ###
      j = 0
      while j < items.length

        console.log items[j]['firstLetter']

        items[j]['firstLetter'] = 'K'

        console.log items[j]['firstLetter']
      ###
      ###
      for i in [0 ... items.length]
        items[i] result.rows.item(i)

      items[firstLetter]
      firstLetter = firstLetter + rs.random(20,'ABCD0987');   # ABCD0987
      ###

      #@items

      callback items if callback

    @currentItems = {}

    @selectedItem


    _tagInfo = undefined
    _postInfo = undefined
    _pageSize = undefined

    _provider = undefined

    #@initGetPostsWithTagToken = (tag, lastPost, pageSize, provider, filterOn, callback) ->
    @initGetPostsWithTagToken = (tag, provider, filterOn, callback) ->

      resultTransactions = array()
      items = {}

      _tagInfo = tag;
      #_postInfo = lastPost;
      #_pageSize = pageSize;

      _provider = provider;

      if databaseService.db == undefined
        databaseService.connect()

      #if(!dataLoaded)

      ###
      async.series([
          dealGetPostsWithTag()

          #process(filterOn)
          process2(filterOn)
        ],
        callback(items))
      ###

      dealGetPostsWithTag callback

      #dataLoaded = true

      items

    #dealGetPostsWithTag = ->
    dealGetPostsWithTag = (callback) ->

      resultTransactions = undefined
      resultTransactions = array()

      expr = squel.expr()

      ###
      if _postInfo

        expr = expr.and("modifyTime < ?", squel.select().field('modifyTime').from('notes').where("id = ?", _postInfo.id))
      ###

      ###
      condictionString = ""

      if (_postInfo != null)

        #params[":id"] = _postInfo.id;
        condictionString += " AND modifyTime < (SELECT modifyTime FROM notes WHERE id=:id)";

      #"SELECT id,title,modifyTime,content,color,selected FROM notes WHERE state = 1 AND content = :contentId AND ';'||tags||';' like '%;'||:keyword||';%'" + condictionString + " ORDER BY title ASC LIMIT 0," + _pageSize.toString(), params
      ###

      query = squel.select()

      .field('id')
      .field('title')
      .field('modifyTime')
      .field('content')
      .field('color')
      .field('selected')

      .from('notes')

      .where(
        #squel.expr().and("state = '1'").and("content = 'facebook'").and("';'||tags||';' like '%;'||:keyword||';%'").and("modifyTime" < squel.select().from('notes').where("id = ?", _postInfo.id))

        #squel.expr().and("state = '1'").and("content = 'facebook'").and("';'||tags||';' like '%;'||';%'").and("modifyTime" < squel.select().from('notes').where("id = ?", _postInfo.id))

        #expr.and("state = '1'").and("content = ?", 'facebook')

        #expr

        # put in again
        #.and("tags like = ?", _keyword)

        #.and("tags like = ?", _tagInfo.id == 0 ? "" : _tagInfo.name;)
        #.and("tags like = ?", _tagInfo.name)
        #.and("tags like = Family") #, _tagInfo.name)
        #"tags like = Family" #, _tagInfo.name)
        #'tags LIKE "Close Friends"' #, _tagInfo.name);
        #'tags LIKE "%Close Friends%"' #, _tagInfo.name);

        'tags LIKE ?', '%' + _tagInfo.name + '%'
      )

      #.order("title", true)

      #.limit(0, 100)

      .toParam()
      #.toString()

      databaseService.db.transaction (tx) ->

        #tx.executeSql query, [], ((tx, result) ->
        tx.executeSql query.text, query.values, ((tx, result) ->

          for i in [0 ... result.rows.length]
            resultTransactions.push result.rows.item(i)

          console.log "dealGetPostsWithTag"

          process2 callback

        ), (tx, error) ->

          console.log error

      #callback() if callback


    #_postInfo = undefined
    _keyword = undefined
    _color = -1

    #initGetLatestPostsToken(lastPost:Object = null, pageSize:Number = 10, keyword:String = null, color:uint = 0xffffff):void
    @initGetLatestPostsToken = (lastPost, pageSize, keyword, color, filterOn, callback) ->

      _postInfo = lastPost
      _pageSize = pageSize
      _keyword = keyword
      _color = color


      if databaseService.db == undefined
        databaseService.connect()

      #if(!dataLoaded)

      async.series([
          dealGetLatestPosts()

          process(filterOn)
        ],
        callback(items))

      #dataLoaded = true

      items

    dealGetLatestPosts = ->

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
        expr.and("modifyTime < ?", squel.select().field('modifyTime').from('notes').where("id = ?", _postInfo.id))

      #"SELECT id,title,modifyTime,color,selected FROM notes WHERE state = 1 " + conditionString + " ORDER BY title ASC LIMIT 0," + _pageSize.toString(), params

      query = squel.select()

      .from('notes')

      .field('id')
      .field('title')
      .field('modifyTime')
      .field('color')
      .field('selected')

      .where(
        expr.and("state = '1'")
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


    @getFirst = (number) ->

      query = squel.select()

      .from('notes')

      .limit(number)

      #.toParam()
      .toString()

      databaseService.db.transaction (tx) ->

        #tx.executeSql query.text, query.values, ((tx, result) ->
        tx.executeSql query, [], ((tx, result) ->

          output = []

          for i in [0 ... result.rows.length]
            output.push result.rows.item(i);

          console.log "getFirst"

          return output;

        ), (tx, error) ->

          console.log error


    @getAllByName = (name) ->

      query = squel.select()

      .from('notes')

      .where(
        'tags LIKE ?', '%' + name.toLowerCase() + '%'
      )

      .order("name", true)

      .toParam()

      databaseService.db.transaction (tx) ->
        tx.executeSql query.text, query.values, ((tx, result) ->

          output = []

          for i in [0 ... result.rows.length]
            output.push result.rows.item(i);

          console.log "getAllByName"

          return output;

        ), (tx, error) ->

          console.log error

    Digits = '0123456789'
    DefaultChars = Digits + 'ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz'

    randomString = (length=32, chars=DefaultChars) ->
      chosen = []
      while chosen.length < length
        chosen.push chars[Math.floor(Math.random() * chars.length)]

      return chosen.join('')

module.exports = AggregationModel
