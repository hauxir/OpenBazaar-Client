var __ = require('underscore'),
    Backbone = require('backbone'),
    $ = require('jquery'),
    userProfileModel = require('../models/userProfileMd'),
    loadTemplate = require('../utils/loadTemplate'),
    chosen = require('../utils/chosen.jquery.min.js'),
    timezonesModel = require('../models/timezonesMd'),
    countriesModel = require('../models/countriesMd');

module.exports = Backbone.View.extend({

  className: "settingsPage",

  events: {
    'click .js-generalTab': 'generalClick',
    'click .js-shippingTab': 'shippingClick',
    'click .js-storeTab': 'storeClick',
    'click .js-blockedTab': 'blockedClick',
    'click .js-advancedTab': 'advancedClick',
    'click .js-cancelSettings': 'cancelClick',
    'click .js-saveSettings': 'saveClick'
  },

  initialize: function(options){
    var self = this;
    this.options = options || {};
    this.userProfile = new userProfileModel();
    this.userProfile.urlRoot = options.userModel.get('server_url') + "profile";
    this.model = new Backbone.Model();
    this.userProfile.fetch({
      data: $.param({'id': this.pageID}),
      success: function(model){
        self.model.set({user: self.options.userModel.toJSON(), page: model.toJSON(), ownPage: self.options.ownPage});
        self.render();
      },
      error: function(model, response){
        console.log("Information for user "+options.userID+" fetch failed: " + response.statusText);
        alert("User Profile cannot be read");
      }
    });
  },

  render: function(){
    var self = this;
    $('#content').html(self.$el);
    self.setCustomStyles();
    loadTemplate('./js/templates/settings.html', function(loadedTemplate) {
      self.$el.html(loadedTemplate(self.model.toJSON()));
      self.setFormValues();
      var user = self.model.attributes.user;
      var avatar = user.avatar_hash;
      $("#inputName").val(user.name);
      $("#inputHandle").val(user.handle);
      $("#inputBtcAddress").val(user.bitcoinAddress);
      $("#inputCurrency").val(user.currencyCode);
      $("#inputCountry").val(user.country);
      $("#inputTimezone").val(user.timezone);
    });
    return this;
  },

  setFormValues: function(){
    var countries = new countriesModel();
    var timezones = new timezonesModel();
    var countryList = countries.get('countries');
    var timezoneList = timezones.get('timezones');
    var country = this.$el.find('#inputCountry');
    var currency = this.$el.find('#inputCurrency');
    var timezone = this.$el.find('#inputTimezone');
    __.each(countryList, function(c, i){
      country.append('<option value="'+c.dataName+'">'+c.name+'</option>');
      currency.append('<option value="'+c.code+'">'+c.currency+'</option>');
    });
    __.each(timezoneList, function(t, i){
      timezone.append('<option value="'+t.offset+'">'+t.name+'</option>');
    });
  },

  setCustomStyles: function() {
    var self = this;
    //only do the following if page has been set in the model
    if(this.model.get('page')){
      var customStyleTag = document.getElementById('customStyle') || document.createElement('style');
      customStyleTag.setAttribute('id', 'customStyle');
      customStyleTag.innerHTML =
          "#ov1 .userPage .custCol-background, #ov1 .userPage.body { background-color: " + this.model.get('page').profile.background_color + ";}" +
          "#ov1 .userPage .custCol-primary-light { transition: background-color .3s cubic-bezier(0, 0, 0.0, 1);  background-color: " + this.shadeColor2(this.model.get('page').profile.primary_color, 0.04) + ";}" +
          "#ov1 .userPage .custCol-primary, #ov1 .userPage .chosen-drop, #ov1 .userPage .no-results { transition: background-color .3s cubic-bezier(0, 0, 0.0, 1); background-color: " + this.model.get('page').profile.primary_color + ";}" +
          "#ov1 .userPage .btn-tab.active { transition: background-color .3s cubic-bezier(0, 0, 0.0, 1); background-color: " + this.model.get('page').profile.primary_color + ";}" +
          "#ov1 .userPage .custCol-secondary { transition: background-color .3s cubic-bezier(0, 0, 0.0, 1); background-color: " + this.model.get('page').profile.secondary_color + ";}" +
          "#ov1 .userPage .custCol-border-secondary { border-color: " + this.model.get('page').profile.secondary_color + " !important;}" +
          "#ov1 .userPage .radioLabel:before { border-color: " + this.model.get('page').profile.text_color + " !important;}" +
          "#ov1 .userPage input[type='radio'].fieldItem:checked + label:before { background: " + this.model.get('page').profile.text_color + " !important;}" +
          "#ov1 .userPage .custCol-text::-webkit-input-placeholder { color: " + this.model.get('page').profile.text_color + " !important;}" +
          "#ov1 .userPage .chosen-choices { background-color: " + this.shadeColor2(this.model.get('page').profile.primary_color, 0.04) + "; border: 0; background-image: none; box-shadow: none; padding: 5px 7px}" +
          "#ov1 .userPage .search-choice { background-color: " + this.model.get('page').profile.secondary_color + "; background-image: none; border: none; padding: 10px; color: " + this.model.get('page').profile.text_color + " ; font-size: 13px; box-shadow: none; border-radius: 3px;}" +
          "#ov1 .userPage .chosen-results li { border-bottom: solid 1px " + this.model.get('page').profile.secondary_color + "}" +
          "#ov1 .userPage .custCol-text, .search-field input { color: " + this.model.get('page').profile.text_color + "!important;}";

      document.body.appendChild(customStyleTag);
      //set custom color input values
      self.$el.find('.js-customizeColorInput').each(function(){
        var newColor = self.model.get('page').profile[$(this).attr('id')];
        $(this).val(newColor);
        $(this).closest('.positionWrapper').find('.js-customizeColor').css('background-color', newColor);
      });
    }
  },

  shadeColor2: function shadeColor2(color, percent) {
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
  },

  tabClick: function(activeTab, showContent){
    "use strict";
    this.$el.find('.js-tab').removeClass('active');
    activeTab.addClass('active');
    this.$el.find('.js-tabTarg').addClass('hide');
    showContent.removeClass('hide');
  },

  generalClick: function(e){
    this.tabClick($(e.target).closest('.js-tab'), this.$el.find('.js-general'));
  },

  shippingClick: function(e){
    this.tabClick($(e.target).closest('.js-tab'), this.$el.find('.js-shipping'));
  },

  storeClick: function(e){
    this.tabClick($(e.target).closest('.js-tab'), this.$el.find('.js-store'));
  },

  blockedClick: function(e){
    this.tabClick($(e.target).closest('.js-tab'), this.$el.find('.js-blocked'));
  },

  advancedClick: function(e){
    this.tabClick($(e.target).closest('.js-tab'), this.$el.find('.js-advanced'));
  },

  cancelClick: function(e){
      alert("CANCEL");
  },

  saveClick: function(e){
      alert("SAVE");
  }

});
