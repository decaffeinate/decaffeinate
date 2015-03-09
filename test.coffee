Ember = require 'ember'

Dashboard = Ember.Application.create()

Ember.View.reopen
  append: ->
    @appendTo @get('element')
