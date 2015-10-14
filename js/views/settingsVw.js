var __ = require('underscore'),
    Backbone = require('backbone'),
    $ = require('jquery'),
    userProfileModel = require('../models/userProfileMd'),
    loadTemplate = require('../utils/loadTemplate'),
    chosen = require('../utils/chosen.jquery.min.js'),
    timezonesModel = require('../models/timezonesMd'),
    languagesModel = require('../models/languagesMd.js'),
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
    loadTemplate('./js/templates/settings.html', function(loadedTemplate) {
      self.$el.html(loadedTemplate(self.model.toJSON()));
      self.setFormValues();
      var user = self.model.attributes.user;
      var avatar = user.avatar_hash;
      $("#inputName").val(user.name);
      $("#inputHandle").val(user.handle);
      $("#refund_address").val(user.bitcoinAddress);
      $("#currency_code").val(user.currency_code);
      $("#inputCountry").val(user.country);
      $("#inputTimezone").val(user.timezone);
      $("#notifications").attr("checked",user.notifications);
      $("#libbitcoin_server").val(user.libbitcoin_server);
      $("#ssl").attr("checked",user.ssl);
      $("#refund_policy").val(user.refund_policy);
      $("#terms_conditions").val(user.terms_conditions);
      console.log(user);
    });
    return this;
  },

  setFormValues: function(){
    var countries = new countriesModel();
    var timezones = new timezonesModel();
    var languages = new languagesModel();
    var countryList = countries.get('countries');
    var timezoneList = timezones.get('timezones');
    var languageList = languages.get('languages');
    var country = this.$el.find('#country');
    var currency = this.$el.find('#currency_code');
    var timezone = this.$el.find('#time_zone');
    var language = this.$el.find('#language');
    __.each(countryList, function(c, i){
      country.append('<option value="'+c.dataName+'">'+c.name+'</option>');
      currency.append('<option value="'+c.code+'">'+c.currency+'</option>');
    });
    __.each(timezoneList, function(t, i){
      timezone.append('<option value="'+t.offset+'">'+t.name+'</option>');
    });
    __.each(languageList, function(l, i){
      language.append('<option value="'+l.langCode+'">'+l.langName+'</option>');
    });
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
      location.reload();
  },

  saveClick: function(e){
        var self = this;
        var formData = new FormData(this.$el.find('#settingsForm')[0]);
        var server = self.options.userModel.get('server_url');
        $.ajax({
                type: "POST",
                url: server + "settings",
                contentType: false,
                processData: false,
                data: formData,
                success: function(data) {
                    console.log(data);
                },
                error: function(jqXHR, status, errorThrown){
                    console.log(jqXHR);
                    console.log(status);
                    console.log(errorThrown);
                }
        });
    }

});
