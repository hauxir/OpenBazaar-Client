var __ = require('underscore'),
    Backbone = require('backbone'),
    $ = require('jquery'),
    userProfileModel = require('../models/userProfileMd'),
    loadTemplate = require('../utils/loadTemplate'),
    timezonesModel = require('../models/timezonesMd'),
    languagesModel = require('../models/languagesMd.js'),
    personListView = require('./userListVw'),
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
    this.pageID = "";
    this.subViews = [];
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
      self.renderBlocked(self.model.get("user").blocked);
    });
    return this;
  },

  renderBlocked: function (model) {
    "use strict";
    this.blockedList = new personListView({model: model,
                                           el: '.js-list1',
                                           title: "No one blocked Yet",
                                           message: ""});
    this.subViews.push(this.followerList);
  },

  setFormValues: function(){
    var countries = new countriesModel();
    var timezones = new timezonesModel();
    var languages = new languagesModel();
    var countryList = countries.get('countries');
    var timezoneList = timezones.get('timezones');
    var languageList = languages.get('languages');
    var country = this.$el.find('#country');
    var ship_country = this.$el.find('#ship_to_country');
    var currency = this.$el.find('#currency_code');
    var timezone = this.$el.find('#time_zone');
    var language = this.$el.find('#language');
    var user = this.model.attributes.user;
    var avatar = user.avatar_hash;
    __.each(countryList, function(c, i){
      var country_option = $('<option value="'+c.dataName+'">'+c.name+'</option>');
      var ship_country_option = $('<option value="'+c.dataName+'">'+c.name+'</option>');
      var currency_option = $('<option value="'+c.code+'">'+c.currency+'</option>');
      currency_option.attr("selected",user.currency_code== c.code);
      country_option.attr("selected",user.country == c.dataName);
      ship_country_option.attr("selected",user.ship_to_country== c.dataName);
      ship_country.append(ship_country_option);
      currency.append(currency_option);
      country.append(country_option);
    });
    __.each(timezoneList, function(t, i){
      var timezone_option = $('<option value="'+t.offset+'">'+t.name+'</option>');
      timezone_option.attr("selected",user.time_zone == t.offset);
      timezone.append(timezone_option);
    });
    __.each(languageList, function(l, i){
        var language_option = $('<option value="'+l.langCode+'">'+l.langName+'</option>');
        language_option.attr("selected",user.language == l.langCode);
        language.append(language_option);
    });
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
        var server = self.options.userModel.get('server_url');

        var settings_form = this.$el.find("#settingsForm");
        if(!settings_form[0].checkValidity()) {
            alert("PLEASE FIX ERRORS");
            return;
        }

        //As there are 3 different API urls we need to call,
        //we need to split up our form data into 3 parts,
        //depending on which API call each value belongs to
        var profileFormData = new FormData();
        var settingsFormData = new FormData();
        var uploadImageFormData = new FormData();
        $.each(settings_form.find("input,select,textarea"),
            function(i,el) {
                var id = $(el).attr("id");
                if(id == "country") {
                    profileFormData.append("location",$(el).val());
                }
                if(id == "name" || id == "handle") {
                    profileFormData.append(id,$(el).val());
                } else if(id == "avatar") {
                    uploadImageFormData.append(id,$(el)[0].files[0]);
                } else {
                    settingsFormData.append(id,$(el).val());
                }
            }
        );

        var submit = function(img_hash) {

            if(img_hash) {
                profileFormData.append("avatar",img_hash);
            }

            $.ajax({
                type: "POST",
                url: server + "settings",
                contentType: false,
                processData: false,
                data: settingsFormData,
                success: function(data) {
                    if(JSON.parse(data).success) {
                        $.ajax({
                            type: "POST",
                            url: server + "profile",
                            contentType: false,
                            processData: false,
                            data: profileFormData,
                            success: function(data) {
                                if(img_hash) {
                                    $(".topThumb").css("background-image",
                                        "url(" + server + "get_image?hash=" +
                                                 img_hash + ")");
                                    $("#avatar").val("");
                                }
                                alert("SAVED!");
                            },
                            error: function(jqXHR, status, errorThrown){
                                console.log(jqXHR);
                                console.log(status);
                                console.log(errorThrown);
                            }
                        });
                    }
                },
                error: function(jqXHR, status, errorThrown){
                    console.log(jqXHR);
                    console.log(status);
                    console.log(errorThrown);
                }
            });

        };

        //Lets upload the image first, if there is one
        //to get the hash
        if($("#avatar").val()) {

            $.ajax({
                type: "POST",
                url: server + "upload_image",
                contentType: false,
                processData: false,
                data: uploadImageFormData,
                success: function(data) {
                    submit(JSON.parse(data).image_hashes[0]);
                },
                error: function(jqXHR, status, errorThrown){
                    console.log(jqXHR);
                    console.log(status);
                    console.log(errorThrown);
                }
            });

        } else { //Otherwise lets just submit right away
            submit();
        }

  },

  close: function(){
    "use strict";
    __.each(this.subViews, function(subView) {
        if(subView.close){
            subView.close();
        }else{
            subView.remove();
        }
    });
    this.remove();
  }

});
