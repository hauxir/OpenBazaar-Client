var __ = require('underscore'),
    Backbone = require('backbone'),
    $ = require('jquery'),
    loadTemplate = require('../utils/loadTemplate'),
    Polyglot = require('node-polyglot'),
    languagesModel = require('../models/languagesMd'),
    countryListView = require('../views/countryListVw'),
    currencyListView = require('../views/currencyListVw'),
    languageListView = require('../views/languageListVw'),
    adminPanelView = require('../views/adminPanelVw'),
    remote = require('remote'),
    cropit = require('../utils/jquery.cropit'),
    currentWindow;

module.exports = Backbone.View.extend({

  el: '#pageNav',

  events: {
    'click .js-navClose': 'navCloseClick',
    'click .js-navMin': 'navMinClick',
    'click .js-navMax': 'navMaxClick',
    'click .js-navBack': 'navBackClick',
    'click .js-navFwd': 'navFwdClick',
    'click .js-navProfile': 'navProfileClick',
    'click .js-navRefresh': 'navRefreshClick',
    'click .js-navAdminPanel': 'navAdminPanel',
    'click .js-navProfileMenu a': 'closeNav',
    'click .js-homeModal-countrySelect': 'countrySelect',
    'click .js-homeModal-currencySelect': 'currencySelect',
    'click .js-homeModal-languageSelect': 'languageSelect',
    'click .js-homeModal-timeSelect': 'timeSelect',
    'click .js-homeModal-newHandle': 'newHandle',
    'click .js-homeModal-existingHandle': 'existingHandle',
    'click .js-homeModal-cancelHandle': 'cancelHandle',
    'change .js-homeModalAvatarUpload': 'uploadAvatar',
    'click .js-homeModalDone': 'settingsDone',
    'click .js-closeModal': 'closeModal',
    'keyup .js-navAddressBar': 'addressBarKeyup',
    'click .js-closeStatus': 'closeStatusBar',
    'click .js-homeModal-themeSelected': 'setSelectedTheme'
  },

  initialize: function(options){
    "use strict";
    var self = this;
    this.socketView = options.socketView;
    this.subViews = [];
    this.languages = new languagesModel();
    this.currentWindow = remote.getCurrentWindow();

    //when language is changed, re-render
    this.listenTo(this.model, 'change:language', function(){
      var newLang = this.model.get("language");
      window.polyglot = new Polyglot({locale: newLang});
      window.polyglot.extend(__.where(this.languages.get('languages'), {langCode: newLang})[0]);
      this.render();
      //refresh the current page
      Backbone.history.loadUrl();
    });

    this.listenTo(window.obEventBus, "socketMessageRecived", function(response){
      this.handleSocketMessage(response);
    });
    this.socketNotificationID = Math.random().toString(36).slice(2);
    this.socketView.getNotifications(this.socketNotificationID);

    this.render();
  },

  handleSocketMessage: function(response) {
    "use strict";
    var data = JSON.parse(response.data);
    if(data.id == this.socketNotificationID){
      console.log(data);
    }
  },

  initAccordion: function(targ){
    "use strict";
    var acc = $(targ);
    var accWidth = acc.width();
    var accHeight = acc.height();
    var accChildren = acc.find('.accordion-child');
    var accNum = accChildren.length;
    var accWin = acc.find('.accordion-window');

    accWin.css({'left':0, 'width': function(){return accWidth * accNum;}});
    accChildren.css({'width':accWidth, 'height':accHeight});
    acc.find('.js-accordionNext').on('click', function(){
      var oldPos = accWin.css('left').replace("px","");
      if(oldPos > (accWidth * accNum * -1 + accWidth)){
        accWin.css('left', function(){
          return parseInt(accWin.css('left').replace("px","")) - accWidth;
        });
      }
      // focus search input
      $(this).closest('.accordion-child').next('.accordion-child').find('input:visible:first').focus();
    });
    acc.find('.js-accordionPrev').on('click', function(){
      var oldPos = accWin.css('left').replace("px","");
      if(oldPos < (0)){
        accWin.css('left', function(){
          return parseInt(accWin.css('left').replace("px","")) + accWidth;
        });
      }
      // focus search input
       $(this).closest('.accordion-child').prev('.accordion-child').find('input:visible:first').focus();
    });
    //set up filterable lists.
    //TODO: this is terrible, change to run when an event is emmitted from the subviews marking them as done rendering
    setTimeout(function(){
      var List = window.List;
      var countryList = new List('homeModal-countryList', {valueNames: ['homeModal-country']});
      var currencyList = new List('homeModal-currencyList', {valueNames: ['homeModal-currency']});
      var timeList = new List('homeModal-timeList', {valueNames: ['homeModal-time']});
      var languageList = new List('homeModal-languageList', {valueNames: ['homeModal-language']});
    }, 1000);
  },

  closeNav: function(){
    "use strict";
    var targ = this.$el.find('.js-navProfileMenu');
    targ.addClass('hide');
    $('#overlay').addClass('fadeOut hide');
  },

  render: function(){
    "use strict";
    var self = this;
    loadTemplate('./js/templates/pageNav.html', function(loadedTemplate) {
      self.$el.html(loadedTemplate(self.model.toJSON()));
      self.countryList = new countryListView({el: '.js-homeModal-countryList', selected: self.model.get('country')});
      self.currencyList = new currencyListView({el: '.js-homeModal-currencyList', selected: self.model.get('currency_code')});
      self.languageList = new languageListView({el: '.js-homeModal-languageList', selected: self.model.get('language')});
      self.subViews.push(self.countryList);
      self.subViews.push(self.currencyList);
      self.subViews.push(self.languageList);
      self.initAccordion('.js-profileAccordion');
      if(self.model.get('beenSet')){
        self.$el.find('.js-homeModal').hide();
      }
      self.$el.find('#avatarUploadDiv').cropit();
      //add the admin panel
      self.adminPanel = new adminPanelView({model: self.model});
      self.subViews.push(self.adminPanel);
      self.addressInput = self.$el.find('.js-navAddressBar');
      self.addressBarGoBtn = self.$el.find('.js-navAddressBarGo');
      self.statusBar = self.$el.find('.js-navStatusBar');
      //listen for address bar set events
      self.listenTo(window.obEventBus, "setAddressBar", function(setText){
        self.addressInput.val(setText);
        self.closeStatusBar();
      });
    });
    return this;
  },

  navProfileClick: function(e){
    "use strict";
    e.stopPropagation();
    var targ = this.$el.find('.js-navProfileMenu');
    if(targ.hasClass('hide')){
      targ.removeClass('hide');
      $('#overlay').removeClass('fadeOut hide');
      $('html').on('click.closeNav', function(e){
        if($(e.target).closest(targ).length === 0){
          targ.addClass('hide');
          $('#overlay').addClass('fadeOut hide');
          $(this).off('.closeNav');
        }
      });
    }else{
      targ.addClass('hide');
      $('#overlay').addClass('fadeOut hide');
    }
  },

  navCloseClick: function(){
    "use strict";
    var process = remote.process;
    if (process.platform != 'darwin') {
      this.currentWindow.close();
    } else {
      this.currentWindow.hide();
    }
  },

  navMinClick: function(){
    "use strict";
    this.currentWindow.minimize();
  },

  navMaxClick: function(){
    "use strict";
    if(this.currentWindow.isMaximized()){
      this.currentWindow.unmaximize();
    } else {
      this.currentWindow.maximize();
    }
  },

  navBackClick: function(){
    "use strict";
    window.history.back();
  },

  navFwdClick: function(){
    "use strict";
    window.history.forward();
  },

  navRefreshClick: function(){
    "use strict";
    this.currentWindow.reload();
  },

  addressBarKeyup: function(e){
    "use strict";
    var barText = this.addressInput.val();
    if(barText.length > 0){
      //detect enter key
      if (e.keyCode == 13){
        this.addressBarProcess(barText);
        this.addressBarGoBtn.addClass("fadeOut");
      } else {
        this.addressBarGoBtn.removeClass("fadeOut");
        this.closeStatusBar();
      }
    } else {
      this.addressBarGoBtn.addClass("fadeOut");
      this.closeStatusBar();
    }
  },

  addressBarProcess: function(addressBarText){
    "use strict";
    var guid = "",
        handle = "",
        state = "",
        itemHash = "",
        addressTextArray = addressBarText.split("/");

    state = addressTextArray[1] ? "/" + addressTextArray[1] : "";
    itemHash = addressTextArray[2] ? "/" + addressTextArray[2] : "";

    if(addressTextArray[0].charAt(0) == "@"){
      handle = addressTextArray[0];
      this.showStatusBar('Navigation by handle is not supported yet.');
    } else if(addressTextArray[0].length === 40){
      guid = addressTextArray[0];
      Backbone.history.navigate('#userPage/' + guid + state + itemHash, {trigger:true});
    } else {
      this.showStatusBar('This is not a valid user GUID or handle.');
    }

  },

  showStatusBar: function(msgText){
    "use strict";
    this.statusBar.find('.js-statusBarMessage').text(msgText);
    this.statusBar.removeClass('fadeOut');
  },

  closeStatusBar: function(){
    "use strict";
    this.statusBar.addClass('fadeOut');
  },

  countrySelect: function(e){
    "use strict";
    var targ = $(e.currentTarget);
    var ctry = targ.attr('data-code');
    $('.js-homeModal-countryList').find('input[type=radio]').prop("checked", false);
    targ.find('input[type=radio]').prop("checked", true);
    this.model.set('country', ctry);
  },

  currencySelect: function(e){
    "use strict";
    var targ = $(e.currentTarget); //TODO: Rename variables to be more readable
    //var crcy = targ.attr('data-name');
    var ccode = targ.attr('data-code');
    $('.js-homeModal-currencyList').find('input[type=radio]').prop("checked", false);
    targ.find('input[type=radio]').prop("checked", true);
    //this.model.set('currency', crcy);
    this.model.set('currency_code', ccode);
  },

  languageSelect: function(e){
    "use strict";
    var targ = $(e.currentTarget); //TODO: Rename variables to be more readable
    var lang = targ.attr('data-code');
    $('.js-homeModal-languageList').find('input[type=radio]').prop("checked", false);
    targ.find('input[type=radio]').prop("checked", true);
    this.model.set('language', lang);
  },

  timeSelect: function(e){
    "use strict";
    var inpt = $(e.target).closest('input[type=radio]'); //TODO: Rename variables to be more readable
    var tz = inpt.attr('id');
    $('.js-homeModal-timezoneList').find('input[type=radio]').prop("checked", false);
    inpt.prop("checked", true);
    this.model.set('time_zone', tz);
  },

  newHandle: function(e){
    "use strict";
    this.$el.find('.js-homeModal-handleInput').closest('.flexRow').removeClass('hide');
    this.$el.find('.js-homeModal-existingHandle').parent().addClass('hide');
    this.$el.find('.js-homeModal-cancelHandle').parent().removeClass('hide');
  },

  existingHandle: function(e){
    "use strict";
    //TODO: add code to connect handle here
  },

  cancelHandle: function(e){
    "use strict";
    this.$el.find('.js-homeModal-handleInput').closest('.flexRow').addClass('hide');
    this.$el.find('.js-homeModal-existingHandle').parent().removeClass('hide');
    this.$el.find('.js-homeModal-cancelHandle').parent().addClass('hide');
  },

  uploadAvatar: function(e){
    "use strict";
    var self = this;
    var reader = new FileReader();
    reader.onload = function (e) {

      self.$el.find('.js-avatarPreview').css('background', 'url(' + e.target.result + ') 50% 50% / cover no-repeat');
      self.model.set('tempAvatar', e.target.result);

      //TODO: add canvas resizing here
    };
    reader.readAsDataURL($(e.target)[0].files[0]);
  },

  settingsDone: function(e){

    "use strict";


    this.model.set('beenSet',true);
var self = this;
    var server = this.model.get('serverUrl');
    var profileFormData = new FormData();
    var settingsFormData = new FormData();
    var uploadImageFormData = new FormData();

    var themeRadioButtons = $('input[name=theme-selection]');
    var themeSelected =   ($(themeRadioButtons.filter(':checked'))[0] !=undefined);
    if(themeSelected){
       var themeId = $(themeRadioButtons.filter(':checked')[0]).attr('id');

      /*from profile api call:
        primary_color = hex color formatted in base 10. For example, 00FF00 should be sent as “65280” (string of base 10 formatted hex color)
        secondary_color= same as primary color
        text_color= same as primary color
        background_color= same as primary color


        header= the hash of the header image. must have been previously uploaded using the upload_image api call. (40 character hex string)
      * */

        var primaryColor = ''+ parseInt($($("label[for='"+themeId+"']")[0]).data('primary-color').replace("#","0x"));
        var secondaryColor = ''+  parseInt($($("label[for='"+themeId+"']")[0]).data('secondary-color').replace("#","0x"));
        var backgroundColor = ''+ parseInt($($("label[for='"+themeId+"']")[0]).data('background-color').replace("#","0x"));
        var textColor = ''+  parseInt($($("label[for='"+themeId+"']")[0]).data('text-color').replace("#","0x"));
        var header = $($("label[for='"+themeId+"']")[0]).data('header');


        self.model.set('primary_color', primaryColor);
        self.model.set('secondary_color', secondaryColor);
        self.model.set('text_color', backgroundColor);
        self.model.set('background_color', textColor);
        //self.model.set('header', header);

    }


    $.each(this.model.attributes,
            function(i,el) {
                if(i == "country") {
                    profileFormData.append("location",el);
                }
                if(i == "name" || i == "handle" || (themeSelected && (i == "primary_color" || i == "secondary_color" || i == "text_color"|| i =="background_color" ))) {
                    profileFormData.append(i,el);
                } else if(i == "tempAvatar") {
                    var imageURI = $('#avatarUploadDiv').cropit('export', {
                        type: 'image/jpeg',
                        quality: 0.75,
                        originalSize: false
                    });
                    if(imageURI) {
                        imageURI = imageURI.replace(/^data:image\/(png|jpeg);base64,/, "");
                        uploadImageFormData.append('image', imageURI);
                    }
                } else {
                    settingsFormData.append(i,el);
                }

            }
        );

      settingsFormData.append("shipping_addresses","");


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
                                 if(data.success === true) {
                                     if(img_hash) {
                                        //TODO store img_hash for all images of profile
                                        //self.model.set("avatar_hash",img_hash);
                                        //console.log("here we are");
                                        //$(".topThumb").css("background-image",
                                        //    "url(" + server + "get_image?hash=" +
                                        //             img_hash + ")");
                                        //("#avatar").val("");
                                     }
                                    self.showErrorModal("Saved", "Your settings have been successfully saved");
                                 }
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



        if(this.model.get('tempAvatar') != "") {
            $.ajax({
                type: "POST",
                url: server + "upload_image",
                contentType: false,
                processData: false,
                data: uploadImageFormData,
                dataType: "JSON",
                success: function(data) {
                     var img_hash = data.image_hashes[0];
                    if(data.success === true && img_hash !== "b472a266d0bd89c13706a4132ccfb16f7c3b9fcb") {
                        submit(img_hash);
                    }
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
    this.$el.find('.js-homeModal').hide();
    
    // Start application walkthrough (coming soon once I have better designs)
  },

  closeModal: function(e){
    "use strict";
    $(e.target).closest('.modal').addClass('fadeOut');
    console.log('sdfdsf');
  },

  navAdminPanel: function(){
    "use strict";
    this.$el.find('.js-adminModal').removeClass('fadeOut');
    this.adminPanel.updatePage();
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
  },

  setSelectedTheme: function(e){
    "use strict"
    // Needs to save to the object and update the dom
  },

  shadeColor2: function shadeColor2(color, percent) {   
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
  }

});

