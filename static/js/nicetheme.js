/*
      /$$
  /$$    /$$$$
   | $$   |_  $$    /$$$$$$$
 /$$$$$$$$  | $$   /$$_____/
|__  $$__/  | $$  |  $$$$$$
   | $$     | $$   \____  $$
   |__/    /$$$$$$ /$$$$$$$/
      |______/|_______/
================================
    Keep calm and get rich.
          Is the best.
*/

var Shuffle = window.Shuffle;
/*
  site aside toggle
  ----------------------------------------------------
*/
$body = $("body");
$overflow = $(".mobile-overflow");
$wrapper = $(".site-wrapper");
$aside = $(".site-aside");
$toggle_button = $(".aside-toggle");
$toggle_button.click(function () {
    $aside.toggleClass("close");
    $toggle_button.toggleClass("active");
    $body.toggleClass("aside-active");
    $wrapper.toggleClass("close");
});
$overflow.click(function (event) {
    event.preventDefault();
    $body.removeClass("aside-active");
    $wrapper.removeClass("close");
    $aside.removeClass("close");
    $toggle_button.removeClass("active");
});

if ($(".masonry-list").length > 0) {
    $grid = new Shuffle(document.querySelector(".masonry-list"), {
        itemSelector: ".grid-item",
        sizer: ".grid-sizer",
        buffer: 1,
        speed: 200,
    });
}

if ($(".index-banner").length > 0) {
    var swiper = new Swiper(".index-banner .mySwiper", {
        slidesPerView: 1,
        effect: "fade",
        loop: true,
        navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
        },
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        pagination: {
            el: ".swiper-pagination",
        },
    });
}

function cookieExists(id) {
    return document.cookie.split(";").some((item) => item.includes(`${id}=`));
}

function resetGridLayout() {
    if (typeof $grid !== "undefined") {
        $grid = new Shuffle(document.querySelector(".masonry-list"), {
            itemSelector: ".grid-item",
            sizer: ".grid-sizer",
            buffer: 1,
            speed: 200,
        });
    }
}

$(document).on("click", ".index-ajax-menu li", function (event) {
    event.preventDefault();
    var t = $(this);
    if (!t.hasClass("active")) {
        $(".index-ajax-menu li").removeClass("active");
        t.addClass("active");

        var cid = t.find("a").data("cid");
        if (cid) {
            $(".dposts-ajax-load").data("tabcid", cid);
        } else {
            $(".dposts-ajax-load").removeData("tabcid");
        }
        $(".dposts-ajax-load").data("paged", 1);

        $(".index-list").empty()

        if (globals.index_style === 1) {
            $(".index-list").html(
                '<div class="col-6 col-md-4 col-xl-3 col-xxxl-20 grid-sizer"></div>'
            );
        }

        if (globals.index_style === 2) {
            $(".index-list").html(
                '<div class="col-12 col-md-6 col-lg-4 col-xxl-4 grid-sizer"></div>'
            );
        }

        $(".dposts-ajax-load").addClass("loading").text(__mg__.load_more);
        ajax_load_posts($(".dposts-ajax-load").data());
    }
});

$(document).on("click", ".dposts-ajax-load", function (event) {
    event.preventDefault();
    var $this = jQuery(this);
    if ($this.hasClass("loading") === false) {
        $this.addClass("loading");
        ajax_load_posts($this.data());
    }
});

function ajax_load_posts(data) {
    $(".loading-more-spinners").show();

    var loadButton = jQuery(".dposts-ajax-load");
    loadButton.hide();

    $.ajax({
        url: globals.ajax_url,
        type: "POST",
        dataType: "html",
        data: data,
    })
        .done(function (response) {
            loadButton.removeAttr("disabled");
            if (response.trim()) {
                loadButton.data("paged", data.paged * 1 + 1);
                $("." + data.append).append(response);
                loadButton.removeClass("loading").show();
                if ($("<div />").append(response).find(".content-error").length > 0)
                    loadButton.hide();
            } else {
                loadButton.attr("disabled", "disabled");
                loadButton.addClass("disabled").show();
                loadButton.text(__mg__.reached_the_end).show();
            }
            resetGridLayout();
        })
        .always(function () {
            $(".loading-more-spinners").hide();
            window.lazyLoad.update();
        });
}

document.addEventListener("alpine:init", () => {
    Alpine.data("postOaCodeData", () => ({
        code: "",
        loading: false,
        showPopup: false,

        submitData() {
            this.loading = true;
            $.ajax({
                url: globals.ajax_url,
                type: "post",
                dataType: "json",
                data: {
                    action: "verify-oa-code",
                    code: this.code,
                    id: this.postId,
                },
            })
                .done((data) => {
                    if (data.status === 200) {
                        ncPopupTips(1, data.msg);
                        window.setTimeout(() => {
                            window.location.reload();
                        }, 3000);
                    } else {
                        ncPopupTips(0, data.msg);
                    }
                })
                .fail(() => {
                    ncPopupTips(0, __mg__.network_error);
                })
                .always(() => {
                    this.loading = false;
                });
        },
    }));

    Alpine.data("postMetaData", () => ({
        loading: false,
        init() {
            this.liked = cookieExists("suxing_ding_" + this.postId);
        },
        like() {
            if (this.loading) return;
            this.loading = true;
            $.ajax({
                url: globals.ajax_url,
                type: "post",
                dataType: "json",
                data: {
                    action: "like-post",
                    id: this.postId,
                },
            })
                .done((res) => {
                    this.liked = !this.liked;
                    this.likesCount = +res.data;
                    if (this.liked) {
                        ncPopupTips(1, __mg__.like);
                    } else {
                        ncPopupTips(0, __mg__.unlike);
                    }
                })
                .fail(() => {
                    ncPopupTips(0, __mg__.network_error);
                })
                .always(() => {
                    this.loading = false;
                });
        },
        collect() {
            if (this.loading) return;
            this.loading = true;
            $.ajax({
                url: globals.ajax_url,
                type: "post",
                dataType: "json",
                data: {
                    action: "collect-post",
                    id: this.postId,
                },
            })
                .done((res) => {
                    if (!res.success) {
                        ncPopupTips(0, __mg__.login_first);
                        return;
                    }

                    this.collected = !this.collected;
                    this.collectsCount = +res.data.number;

                    if (this.collected) {
                        ncPopupTips(1, __mg__.bookmark);
                    } else {
                        ncPopupTips(0, __mg__.remove_form_bookmarks);
                    }
                })
                .fail(() => {
                    ncPopupTips(0, __mg__.network_error);
                })
                .always(() => {
                    this.loading = false;
                });
        },
        trashPost() {
            if (this.loading) return;

            this.loading = true;
            $.ajax({
                url: globals.ajax_url,
                type: "post",
                dataType: "json",
                data: {
                    action: "mg-trash-post",
                    id: this.postId,
                    nonce: this.trashNonce,
                },
            })
                .done((res) => {
                    if (!res.success) {
                        ncPopupTips(0, res.data.msg);
                        return;
                    }
                    ncPopupTips(1, res.data.msg);
                    setTimeout(() => {
                        window.location.href = res.data.url;
                    }, 1000);
                })
                .fail(() => {
                    ncPopupTips(0, __mg__.network_error);
                })
                .always(() => {
                    this.showTrashPostPopup = false;
                    this.loading = false;
                });
        },
    }));
});


/* ---------------------------------------------- /*
* showSearchPopup
/* ---------------------------------------------- */
if ($(".search-popup").length > 0) {
    var SearchModal = document.getElementById('SearchModal');

    function showSearchModal() {
        SearchModal.classList.add('active');
        document.body.classList.add("no-scroll");
    }

    function hideSearchModal() {
        SearchModal.classList.remove('active');
        document.body.classList.remove("no-scroll");
    }

    const inputElement = document.getElementById('SearchInput');
    const containerElement = document.querySelector('.search-popup');

    inputElement.addEventListener('focus', () => {
        containerElement.classList.add('focused');
    });

    inputElement.addEventListener('blur', () => {
        containerElement.classList.remove('focused');
    });
}
/* ---------------------------------------------- /*
* Dropdown (Custom Dropdown)
/* ---------------------------------------------- */
function showDropdown(menuId) {
    var dropdownMenu = document.getElementById(menuId);
    dropdownMenu.classList.add("show");
}

function hideDropdown(menuId) {
    var dropdownMenu = document.getElementById(menuId);
    dropdownMenu.classList.remove("show");
}

/* ---------------------------------------------- /*
* toggle Dark Mode
/* ---------------------------------------------- */
function toggleDarkMode() {
    $("body").toggleClass("nice-dark-mode");
    var isDark = $("body").hasClass("nice-dark-mode");
    setCookie("dark", isDark ? "false" : "true", 365, "/");
    if (isDark) {
        $(".dark-toggle").addClass("active");
    } else {
        $(".dark-toggle").removeClass("active");
    }
}
function setCookie(name, value, days, path) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + encodeURIComponent(value) + expires + "; path=" + (path || "/");
}
 
/* ---------------------------------------------- /*
  * Header Fixed
/* ---------------------------------------------- */
if ($(".default-layout").length) {
   $(document).ready(function () {
        var $stickyNavbar = $(".site-header"),
            navbarHeight = $stickyNavbar.innerHeight(),
            innerHeight = window.innerHeight,
            mainHeight = $("body").innerHeight() - navbarHeight;
    
        $(window).scroll(function () {
            if (mainHeight > innerHeight) {
                if ($(window).scrollTop() <= navbarHeight) {
                    $stickyNavbar.removeClass("fixed");
                } else {
                    $stickyNavbar.addClass("fixed");
                }
            }
        });
    });
}


jQuery(document).ready(function ($) {
    if ($(".lazy").length) {
        window.lazyLoad = new LazyLoad({
            use_native: true,
            callback_loaded: function () {
                resetGridLayout();
            },
        });

    }
    /* ---------------------------------------------- /*
      * Login Modal
    /* ---------------------------------------------- */

    var $form_modal = $(".login-modal"),
        $form_login = $form_modal.find("#login"),
        $form_loginphone = $form_modal.find("#loginphone"),
        $form_loginwechat = $form_modal.find("#loginwechat"),
        $form_signup = $form_modal.find("#signup"),
        $form_forgot_password = $form_modal.find("#reset-password"),
        $loginphone_link = $form_modal.find(".login-phone-button"),
        $loginwechat_link = $form_modal.find(".login-wechat-button"),
        $login_link = $form_modal.find(".login-button"),
        $signup_link = $form_modal.find(".signup-button"),
        $forgot_password_link = $form_modal.find(".reset-pwd"),
        $back_to_login_link = $form_forgot_password.find(".back-top-login"),
        $sign_button = $(".sign-menu"),
        $body = $("body");
        

    //open modal
    $sign_button.on("click", function (event) {
        $form_modal.addClass("is-visible");
        $body.addClass("no-scroll");
        login_selected();
    });
    //close modal
    $(".login-modal").on("click", function (event) {
        // event.preventDefault();
        if (
            $(event.target).is($form_modal)
        ) {
            $form_modal.removeClass("is-visible");
            $body.removeClass("no-scroll");
        }
    });

    $(".login-close").on("click", function (event) {
        event.preventDefault();
        $form_modal.removeClass("is-visible");
        $body.removeClass("no-scroll");
    });

    //close modal when clicking the esc keyboard button
    $(document).keyup(function (event) {
        if (event.which == "27") {
            $form_modal.removeClass("is-visible");
            $body.removeClass("no-scroll");
        }
    });

    //show mail form
    $signup_link.on("click", function (event) {
        event.preventDefault();
        signup_selected();
    });

    //show mail form
    $login_link.on("click", function (event) {
        event.preventDefault();
        login_selected();
    });

    //show phone form
    $loginphone_link.on("click", function (event) {
        event.preventDefault();
        login_phone_selected();
    });

    //show phone form
    $loginwechat_link.on("click", function (event) {
        event.preventDefault();
        login_wechat_selected();
    });

    //show forgot-password form
    $forgot_password_link.on("click", function (event) {
        event.preventDefault();
        forgot_password_selected();
    });

    //back to login from the forgot-password form
    $back_to_login_link.on("click", function (event) {
        event.preventDefault();
        login_selected();
    });

    function login_wechat_selected() {
        $form_login.removeClass("is-selected");
        $form_loginphone.removeClass("is-selected");
        $form_loginwechat.addClass("is-selected");
        $form_signup.removeClass("is-selected");
        $form_forgot_password.removeClass("is-selected");
    }

    function login_selected() {
        $form_login.addClass("is-selected");
        $form_loginphone.removeClass("is-selected");
        $form_loginwechat.removeClass("is-selected");
        $form_signup.removeClass("is-selected");
        $form_forgot_password.removeClass("is-selected");
    }

    function login_phone_selected() {
        $form_login.removeClass("is-selected");
        $form_loginphone.addClass("is-selected");
        $form_loginwechat.removeClass("is-selected");
        $form_signup.removeClass("is-selected");
        $form_forgot_password.removeClass("is-selected");
    }

    function signup_selected() {
        $form_login.removeClass("is-selected");
        $form_loginphone.removeClass("is-selected");
        $form_loginwechat.removeClass("is-selected");
        $form_signup.addClass("is-selected");
        $form_forgot_password.removeClass("is-selected");
    }

    function forgot_password_selected() {
        $form_login.removeClass("is-selected");
        $form_loginphone.removeClass("is-selected");
        $form_loginwechat.removeClass("is-selected");
        $form_signup.removeClass("is-selected");
        $form_forgot_password.addClass("is-selected");
    }

    /* ---------------------------------------------- /*
      * navbar has children
      /* ---------------------------------------------- */
    if ($(".navbar-site li").hasClass("menu-item-has-children")) {
        $(".navbar-site .menu-item-has-children")
            .children("a")
            .append('<span class="menu-sign"></span>');
    }

    /* ---------------------------------------------- /*
      * TheiaStickySidebar
      /* ---------------------------------------------- */
   /* if ($(".site-sidebar").length) {
        $(".site-sidebar").theiaStickySidebar({
            additionalMarginTop: 20,
        });
    }

    /*
        hide or show password
        ----------------------------------------------------
      */
    $(".hide-password").on("click", function () {
        var $this = $(this),
            $password_field = $this.prev("input");

        "password" == $password_field.attr("type")
            ? $password_field.attr("type", "text")
            : $password_field.attr("type", "password");
        '<i class="iconfont icon-yulan-dakai_preview-open"></i>' == $this.html()
            ? $this.html('<i class="iconfont icon-yulan-guanbi_preview-close-one"></i>')
            : $this.html('<i class="iconfont icon-yulan-dakai_preview-open"></i>');
    });

    /*
        site aside menu
        ----------------------------------------------------
      */
    $(".aside-menu li.menu-item-has-children>a").append(
        '<span class="menu-sign"></span>'
    );
    $(".aside-menu li.menu-item-has-children>a").on("click", function (s) {
        $(this).siblings(".sub-menu")[0] &&
            (s.preventDefault(),
                $(this).parent().hasClass("in")
                    ? ($(this).parent().removeClass("in"),
                        $(this).parent().find(".in").removeClass("in"),
                        $(this).parent().find(".sub-menu").stop(!0).slideUp(300))
                    : ($(this).closest(".in")[0] ||
                        ($(this)
                            .find(".menu-item-has-children.in .sub-menu")
                            .stop(!0)
                            .slideUp(300),
                            $(this).find(".menu-item-has-children.in").removeClass("in")),
                        $(this).parent().addClass("in"),
                        $(this)
                            .parent()
                            .siblings(".in")
                            .find(".sub-menu")
                            .stop(!0)
                            .slideUp(300),
                        $(this).parent().siblings(".in").removeClass("in"),
                        $(this).siblings(".sub-menu").stop(!0).slideDown(300)));
    });
    /*
        site totop
        ----------------------------------------------------
      */

    var back_to_top = $(".totop-button");

    $(window).scroll(function () {
        if ($(window).scrollTop() > 300) {
            back_to_top.addClass("show");
        } else {
            back_to_top.removeClass("show");
        }
    });

    back_to_top.on("click", function (e) {
        e.preventDefault();
        $("html, body").animate({ scrollTop: 0 }, "300");
    });

    /*
        site comments
        ----------------------------------------------------
      */
    function ajax_load_comments(data) {
        var buttonDOM = $("#comments-next-button");
        buttonDOM.hide();

        $.ajax({
            url: globals.ajax_url,
            type: "POST",
            dataType: "html",
            data: data,
        }).done(function (response) {
            if (response) {
                if (data.commentspage == "newest") {
                    buttonDOM.data("paged", data.paged * 1 - 1);
                } else {
                    buttonDOM.data("paged", data.paged * 1 + 1);
                }
                $("." + data.append).append(response);
                buttonDOM.show();
            } else {
                buttonDOM.hide();
            }
        });
    }

    function toggleCommentAuthorInfo() {
        var changeMsg = '<i class="iconfont icon-bianjixingming_edit-name"></i>';
        var closeMsg = '<i class="iconfont icon-cachu_erase" ></i>';
        $(".comment-form-info").slideToggle("slow", function () {
            if ($(".comment-form-info").css("display") == "none") {
                $("#toggle-comment-author-info").html(changeMsg);
            } else {
                $("#toggle-comment-author-info").html(closeMsg);
            }
        });
    }

    $(document).on("click", "#comments-next-button", function (event) {
        event.preventDefault();
        ajax_load_comments($("#comments-next-button").data());
    });

    /*
        site toc
        ----------------------------------------------------
      */
    if ($(".post-toc").length > 0) {
        var headerEl = "h2,h3,h4",
            content = ".post-content",
            idArr = {};

        $(content).find(headerEl).parents(".post").addClass("has-toc");

        $(content)
            .children(headerEl)
            .each(function () {
                var headerId = $(this)
                    .text()
                    .replace(
                        /[\s|\~|`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\_|\+|\=|\||\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?|\：|\，|\。]/g,
                        ""
                    );

                headerId = headerId.toLowerCase();
                if (idArr[headerId]) {
                    $(this).attr("id", headerId + "-" + idArr[headerId]);
                    idArr[headerId]++;
                } else {
                    idArr[headerId] = 1;
                    $(this).attr("id", headerId);
                }
            });

        tocbot.init({
            tocSelector: ".post-toc",
            contentSelector: content,
            headingSelector: headerEl,
            positionFixedSelector: ".post-toc",
            positionFixedClass: "is-position-fixed",
            scrollSmooth: true,
            scrollSmoothOffset: -100,
            headingsOffset: 100,
            hasInnerContainers: true,
        });
    }
    if ($(".copy-permalink").length > 0) {
        var clipboard = new ClipboardJS(".copy-permalink");

        clipboard.on("success", function (e) {
            ncPopupTips(true, __mg__.copied);
            e.clearSelection();
        });

        clipboard.on("error", function (e) {
            ncPopupTips(false, __mg__.copied_failed);
        });
    }
});
