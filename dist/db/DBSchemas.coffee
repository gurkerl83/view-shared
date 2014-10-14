class DBSchemas extends Constant
  constructor: ->
    return {

    create:
      notes: 'CREATE TABLE IF NOT EXISTS notes(id INTEGER PRIMARY KEY, title TEXT, content TEXT, createTime DATETIME, modifyTime DATETIME, state INTEGER, tags TEXT, color INTEGER DEFAULT -1, selected INTEGER DEFAULT -1)'
      notes_attach: 'CREATE TABLE IF NOT EXISTS notes_attach(id INTEGER PRIMARY KEY, url TEXT, noteId INTEGER, createTime DATETIME)'
      notes_tag: 'CREATE TABLE IF NOT EXISTS notes_tag(id INTEGER PRIMARY KEY, name TEXT, createTime DATETIME, latestTime DATETIME, useCount INTEGER, pinyin TEXT, fpinyin TEXT, selected INTEGER DEFAULT -1)'

      notes_tag_set: 'CREATE TABLE IF NOT EXISTS notes_tag_set(tagId INTEGER, noteId INTEGER, FOREIGN KEY(tagId) REFERENCES notes_tag(id), FOREIGN KEY(noteId) REFERENCES notes(id))'

      rss_list: 'CREATE TABLE IF NOT EXISTS rss_list(id INTEGER PRIMARY KEY, title TEXT, link TEXT, desc TEXT, image TEXT, url TEXT, createTime DATETIME, updateTime DATETIME)'
      rss_items: 'CREATE TABLE IF NOT EXISTS rss_items(id INTEGER PRIMARY KEY, rssId INTEGER, title TEXT, link TEXT, category TEXT, description TEXT, pubDate DATETIME, author TEXT, comments TEXT, source TEXT, FOREIGN KEY(rssId) REFERENCES rss_list(id))'
      subscripts: 'CREATE TABLE IF NOT EXISTS subscripts(rssId INTEGER, createTime DATETIME, FOREIGN KEY(rssId) REFERENCES rss_list(id))'


    insert:
      notes: 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(:title, :content, :createTime, :modifyTime, 1, :tags)'

    select:
      notes: 'INSERT INTO notes(title, content, createTime, modifyTime, state, tags) VALUES(:title, :content, :createTime, :modifyTime, 1, :tags)'

    ###
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
    ###

    }

module.exports = DBSchemas