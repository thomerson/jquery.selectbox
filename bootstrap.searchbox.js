// Author: thomerson(wechat)
// E-mail: tanghongsheng123@126.com 
// Date: 2017-06-18
// Version: 1.0
// Note: 解决select一次性加载全部数据很慢的问题，通过模糊查询的方式，每次取top max条数据
// Instructions: 点击下拉框中的Go按钮或者在搜索框中按下Enter键可以从后台刷新数据
//               同时提供已有数据自动过滤功能
// DevelopUse: $('input').searchSelect(options);

(function ($) {
    var defaults = {
        url: '',  //格式类型  get请求  //必填 /XXX/XXX?text={0}&maxCount=200
        optionValue: '',//必填
        optionText: '',//必填
        textName: 'text', //input data-text
        multiple: false,//多选
        showSearch: false,//显示搜索框
        separator: ',',//多选数据分隔符
        liClick: ''//li click 后触发事件  联动使用  function($li,value,text){}
    };


    var arrayField = function (search, $input, $val) {
        this.$input = $input;
        this.array = [];
        this.setStr = function (str) {
            this.array = str ? str.split(search.defaults.separator) : [];
            this.change();
        };

        this.getStr = function () {
            return this.array.join(search.defaults.separator);
        };

        this.add = function (val) {
            this.array.push(val);
            this.change();
        };
        this.del = function (val) {
            this.array.splice($.inArray(val, this.array), 1);
            this.change();
        };
        this.clear = function () {
            this.array.splice(0, this.array.length);
            this.change();
        };
        this.change = function () {
            var str = this.getStr();
            $input.val(str);
            if ($val) {
                $val.data(search.defaults.textName, str);
            }
        };

        this.setStr($input.val());
    }

    var stringField = function (search, $input, $val) {
        this.str = $input.val();
        this.get = function () {
            return str;
        };
        this.set = function (val) {
            this.str = val;
            $input.val(val);
            if ($val) {
                $val.data(search.defaults.textName, val);
            }
        };
    };

    var searchselect = function ($input, options) {
        var $self = this;
        $self.defaults = $.extend({}, defaults, options);
        var $dom = $('<div class="btn-group searchselect" ></div>');
        var $text = $('<input type="text" class="form-control" style="display:inline" readonly />');
        var toggle = function () {
            if ($dom.hasClass('open')) {
                $dom.removeClass('open');
            } else {
                $dom.addClass('open');
            }
        };
        $text.unbind('click').bind('click', toggle);
        $dom.append($text);
        var $btnDropdown = $('<button type="button" class="btn dropdown-toggle" style="float:none;left:-30px;"><span class="caret"></span></button>');
        $btnDropdown.unbind('click').bind('click', toggle);
        $dom.append($btnDropdown);
        var $ul = $('<ul class="dropdown-menu" style="max-height:300px;overflow-y:auto;"></ul>');
        //$ul.unbind('mouseleave').bind('mouseleave', function () {
        //    $dom.removeClass('open');
        //});

        $(document).mouseup(function (e) {
            if ($(e.target).parents(".searchselect").length === 0) {
                $dom.removeClass('open');
            }
        });


        $dom.append($ul)
        if ($self.defaults.showSearch) {
            var $search = $('<input type="text" class="form-control" placeholder="Search for...">');
            $search.unbind('input').bind('input', function () {
                $self.filter();
            }).unbind('keydown').bind('keydown', function (e) {
                //13是键盘上面固定的回车键
                if (e.keyCode == 13) {
                    $self.refresh();
                }
            });

            var $btnSearch = $('<button class="btn btn-default" style="padding:4px 4px;" type="button">Go!</button>');
            $btnSearch.unbind('click').bind('click', function () {
                $self.refresh();
            });
            var $span = $('<span class="input-group-btn"></span>').append($btnSearch);
            var $div = $('<div class="input-group"></div>').append($search).append($span);
            var $li = $('<li></li>').append($div);
            $dom.find('ul').append($li);
        }

        $input.after($dom);

        $input.bind('change', function () {
            $self.change();
        });
        $self.$dom = $dom;
        $self.$input = $input;
        $self.$text = $text;
        if ($self.defaults.multiple) {
            $self.value = new arrayField($self, $input);
            $self.text = new arrayField($self, $text, $input);
        } else {
            $self.value = new stringField($self, $input);
            $self.text = new stringField($self, $text, $input);
        }


    };

    searchselect.prototype = {
        refresh: function () {
            var self = this;
            self.$dom.find('ul li[data-value]').remove();
            var text = this.$dom.find('li .input-group input').val() || '';

            var url = self.defaults.url.replace('{0}', text.trim());

            $.get(url, {}, function (data, status) {
                if (status !== 'success') {
                    alert('searchbox error: ' + self.defaults.url + ' response status is' + status);
                    return;
                }
                if (!Object.prototype.toString.call(data) == "[object Array]") {
                    alert('searchbox error:the data get from url is not an array ');
                }
                $.each(data, function (index, item) {
                    var $li = $('<li data-value="' + item[self.defaults.optionValue] + '"><a href="#">' + item[self.defaults.optionText] + '<span class="glyphicon glyphicon-ok hide" style="float:right;"></span></a></li>');

                    if (self.defaults.multiple && $.inArray(item[self.defaults.optionValue] + '', self.value.array) > -1) {
                        $li.addClass('selected').find('span').removeClass('hide');
                        if ($.inArray(item[self.defaults.optionText] + '', self.text.array) === -1) {
                            self.text.add(item[self.defaults.optionText] + '');
                        }
                    } else if (!self.defaults.multiple && item[self.defaults.optionValue] + '' === self.value.str) {
                        $li.addClass('selected').find('span').removeClass('hide');
                        if (item[self.defaults.optionValue] + '' === self.text.str) {
                            self.text.set(item[self.defaults.optionText] + '');
                        }
                    }
                    self.$dom.find('ul').append($li);
                });

                self.$dom.find('ul li[data-value]').unbind('click').bind('click', function () {
                    var value = $(this).data('value');
                    var $this = $(this);
                    var text = $this.find('a').text();
                    if (self.defaults.multiple) {
                        if ($this.hasClass('selected')) {
                            //remove
                            self.value.del(value);
                            self.text.del(text);
                            $this.removeClass('selected');
                            $this.find('span').addClass('hide');
                        } else {//add
                            self.value.add(value);
                            self.text.add(text);
                            $this.addClass('selected');
                            $this.find('span').removeClass('hide');
                        }
                    } else {
                        self.$dom.find('ul li[data-value]').removeClass('selected').find('span').addClass('hide');
                        $this.addClass('selected');
                        $this.find('span').removeClass('hide');
                        self.value.set(value);
                        self.text.set(text);
                    }
                    if (typeof self.defaults.liClick === 'function') {
                        self.defaults.liClick($this, value, text);
                    }
                });

                self.change();

            });
        },
        change: function () {
            var self = this;
            var str = self.$input.val() || '';
            self.$text.val(self.$input.data(self.defaults.textName));
            self.$dom.find('ul li[data-value]').removeClass('selected').find('span').addClass('hide');
            if (self.defaults.multiple) {
                var arr = str ? str.split(self.defaults.separator) : [];
                self.value.clear();
                self.text.clear();
                $.each(arr, function (index, item) {
                    self.$dom.find('ul li[data-value=' + item + ']').trigger('click');
                });
            } else {
                self.$dom.find('ul li[data-value=' + str.trim() + ']').trigger('click');
            }

        },
        filter: function () {
            var self = this;
            var str = self.$dom.find('li .input-group input').val().toLowerCase();
            var $li = self.$dom.find('ul li[data-value]');
            if (str) {
                $li.each(function () {
                    var $this = $(this);
                    if ($this.find('a').text().toLowerCase().indexOf(str) === -1) {
                        $this.addClass('hide');
                    } else {
                        $this.removeClass('hide');
                    }
                });
            } else {
                $li.removeClass('hide');
            }
        }
    };



    $.fn.searchSelect = function (options) {
        return this.each(function () {
            $(this).hide();
            var search = new searchselect($(this), options);
            search.refresh();
        });
    };

    //$.fn.inputUpdate = function () {
    //    console.log(this);
    //    $(this).trigger('change');
    //};

})(jQuery);