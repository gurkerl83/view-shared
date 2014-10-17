#DBSchemas = require './DBSchemas'

#sql = require 'sql'


class Database extends Service

  #constructor: (DBSCHEMAS) ->
  constructor: ->

    @db = undefined

    notes = 'CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY, title TEXT, content TEXT, createTime DATETIME, modifyTime DATETIME, state INTEGER, tags TEXT, color INTEGER DEFAULT -1, selected INTEGER DEFAULT -1)'

    notes_attach = 'CREATE TABLE IF NOT EXISTS notes_attach(id INTEGER PRIMARY KEY, url TEXT, noteId INTEGER, createTime DATETIME)'
    notes_tag = 'CREATE TABLE IF NOT EXISTS notes_tag(id INTEGER PRIMARY KEY, name TEXT, createTime DATETIME, latestTime DATETIME, useCount INTEGER, pinyin TEXT, fpinyin TEXT, selected INTEGER DEFAULT -1)'

    notes_tag_set = 'CREATE TABLE IF NOT EXISTS notes_tag_set(tagId INTEGER, noteId INTEGER, FOREIGN KEY(tagId) REFERENCES notes_tag(id), FOREIGN KEY(noteId) REFERENCES notes(id))'

    lastInsertRowID = -1

    #connect = ->
    @connect = ->

      if window.openDatabase
        @db = window.openDatabase 'Millipede'
        , '0.0'
        , 'Storage quota test application'
        , 5 * 1024 * 1024

        @initializeWebSqlDatabase()

      else

        console.log "Web DB not available"

        #dbPath = kango.io.getResourceUrl("/data/database");

        #dbPath = kango.io.getResourceUrl("/data/database.db");
        #@db = new sql.Database(dbPath);

        #@db = new sql.Database();

        @initializeSqlDatabase()

      @db

    @initializeSqlDatabase = ->

      ###
      @db.run(DBSchemas.create.notes)

      @db.run(DBSchemas.create.notes_attach)

      @db.run(DBSchemas.create.notes_tag)

      @db.run(DBSchemas.create.notes_tag_set)

      @db.run(DBSchemas.create.rss_list)
      @db.run(DBSchemas.create.rss_items)
      @db.run(DBSchemas.create.subscripts)
      ###

    @initializeWebSqlDatabase = ->

      #console.log DBSCHEMAS

      @db.transaction (tx) ->

        #tx.executeSql DBSchemas.create.notes, [], ((tx, result) ->
        tx.executeSql notes, [], ((tx, result) ->

          console.log result

        ), (tx, error) ->

          console.log error

      @db.transaction (tx) ->

        #tx.executeSql DBSchemas.create.notes_attach, [], ((tx, result) ->
        tx.executeSql notes_attach, [], ((tx, result) ->

          console.log result

        ), (tx, error) ->

          console.log error

      @db.transaction (tx) ->

        #tx.executeSql DBSchemas.create.notes_tag, [], ((tx, result) ->
        tx.executeSql notes_tag, [], ((tx, result) ->

          console.log result

        ), (tx, error) ->

          console.log error

      @db.transaction (tx) ->

        #tx.executeSql DBSchemas.create.notes_tag_set, [], ((tx, result) ->
        tx.executeSql notes_tag_set, [], ((tx, result) ->

          console.log result

        ), (tx, error) ->

          console.log error

  ###
  @instance: (=>
    instance = null
    =>
      instance = new @() if not instance
      instance
  )()
  ###

#module.exports = Database