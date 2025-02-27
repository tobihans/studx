import keymage from "keymage";
import { io } from "socket.io-client";
import whiteboard from "./whiteboard";
import keybinds from "./keybinds";
import Picker from "vanilla-picker";
import shortcutFunctions from "./shortcutFunctions";
import ReadOnlyService from "./services/ReadOnlyService";
import InfoService from "./services/InfoService";
import { getSubDir, setupToolTips } from "./utils";
import ConfigService from "./services/ConfigService";
import { v4 as uuidv4 } from "uuid";
import * as CONSTANTS from "./consts";

const pdfjsLib = require("pdfjs-dist");

const urlParams = new URLSearchParams(window.location.search);
let whiteboardId = urlParams.get("whiteboardid");

if (!whiteboardId) {
    // Set a random ID if none is provided
    whiteboardId = uuidv4();
}

whiteboardId = unescape(encodeURIComponent(whiteboardId)).replace(/[^a-zA-Z0-9\-]/g, "");

if (urlParams.get("whiteboardid") !== whiteboardId) {
    urlParams.set("whiteboardid", whiteboardId);
    window.location.search = urlParams;
}

const myUsername = urlParams.get("username") || "unknown" + (Math.random() + "").substring(2, 6);
const accessToken = urlParams.get("accesstoken") || "";
const copyfromwid = urlParams.get("copyfromwid") || "";

// Custom Html Title
const title = urlParams.get("title");
if (title) {
    document.title = decodeURIComponent(title);
}

const subdir = getSubDir();
let signaling_socket;

function main() {
    signaling_socket = io("", { path: subdir + "/ws-api" }); // Connect even if we are in a subdir behind a reverse proxy

    signaling_socket.on("connect", function () {
        console.log("Websocket connected!");

        signaling_socket.on("whiteboardConfig", (serverResponse) => {
            ConfigService.initFromServer(serverResponse);
            // Inti whiteboard only when we have the config from the server
            initWhiteboard();
        });

        signaling_socket.on("whiteboardInfoUpdate", (info) => {
            InfoService.updateInfoFromServer(info);
            whiteboard.updateSmallestScreenResolution();
        });

        signaling_socket.on("drawToWhiteboard", function (content) {
            whiteboard.handleEventsAndData(content, true);
            InfoService.incrementNbMessagesReceived();
        });

        signaling_socket.on("refreshUserBadges", function () {
            whiteboard.refreshUserBadges();
        });

        let accessDenied = false;
        signaling_socket.on("wrongAccessToken", function () {
            if (!accessDenied) {
                accessDenied = true;
                showBasicAlert("Access denied! Wrong accessToken!");
            }
        });

        signaling_socket.emit("joinWhiteboard", {
            wid: whiteboardId,
            at: accessToken,
            windowWidthHeight: { w: $(window).width(), h: $(window).height() },
        });
    });
}

function showBasicAlert(html, newOptions) {
    var options = {
        header: "INFO MESSAGE",
        okBtnText: "Ok",
        headercolor: "#d25d5d",
        hideAfter: false,
        onOkClick: false,
    };
    if (newOptions) {
        for (var i in newOptions) {
            options[i] = newOptions[i];
        }
    }
    var alertHtml = $(
        '<div class="basicalert" style="position:absolute; left:0px; width:100%; top:70px; font-family: monospace;">' +
            '<div style="width: 30%; margin: auto; background: #aaaaaa; border-radius: 5px; font-size: 1.2em; border: 1px solid gray;">' +
            '<div style="border-bottom: 1px solid #676767; background: ' +
            options["headercolor"] +
            '; padding-left: 5px; font-size: 0.8em;">' +
            options["header"] +
            '<div style="float: right; margin-right: 4px; color: #373737; cursor: pointer;" class="closeAlert">x</div></div>' +
            '<div style="padding: 10px;" class="htmlcontent"></div>' +
            '<div style="height: 20px; padding: 10px;"><button class="modalBtn okbtn" style="float: right;">' +
            options["okBtnText"] +
            "</button></div>" +
            "</div>" +
            "</div>"
    );
    alertHtml.find(".htmlcontent").append(html);
    $("body").append(alertHtml);
    alertHtml
        .find(".okbtn")
        .off("click")
        .click(function () {
            if (options.onOkClick) {
                options.onOkClick();
            }
            alertHtml.remove();
        });
    alertHtml
        .find(".closeAlert")
        .off("click")
        .click(function () {
            alertHtml.remove();
        });

    if (options.hideAfter) {
        setTimeout(function () {
            alertHtml.find(".okbtn").click();
        }, 1000 * options.hideAfter);
    }
}

function initWhiteboard() {
    $(document).ready(function () {
        // by default set in readOnly mode
        ReadOnlyService.activateReadOnlyMode();

        whiteboard.loadWhiteboard("#whiteboardContainer", {
            //Load the whiteboard
            whiteboardId: whiteboardId,
            username: btoa(encodeURIComponent(myUsername)),
            backgroundGridUrl: "./images/" + ConfigService.backgroundGridImage,
            sendFunction: function (content) {
                if (ReadOnlyService.readOnlyActive) return;
                content["at"] = accessToken;
                signaling_socket.emit("drawToWhiteboard", content);
                InfoService.incrementNbMessagesSent();
            },
        });

        // request whiteboard from server
        $.get(subdir + "/api/loadwhiteboard", { wid: whiteboardId, at: accessToken }).done(
            function (data) {
                whiteboard.loadData(data);
                if (copyfromwid && data.length == 0) {
                    //Copy from witheboard if current is empty and get parameter is given
                    $.get(subdir + "/api/loadwhiteboard", {
                        wid: copyfromwid,
                        at: accessToken,
                    }).done(function (data) {
                        whiteboard.loadData(data);
                    });
                }
            }
        );

        $(window).resize(function () {
            signaling_socket.emit("updateScreenResolution", {
                at: accessToken,
                windowWidthHeight: { w: $(window).width(), h: $(window).height() },
            });
        });

        /*----------------/
        Whiteboard actions
        /----------------*/

        var tempLineTool = false;
        var strgPressed = false;
        //Handle key actions
        $(document).on("keydown", function (e) {
            if (e.which == 16) {
                if (whiteboard.tool == "pen" && !strgPressed) {
                    tempLineTool = true;
                    whiteboard.ownCursor.hide();
                    if (whiteboard.drawFlag) {
                        whiteboard.mouseup({
                            offsetX: whiteboard.prevPos.x,
                            offsetY: whiteboard.prevPos.y,
                        });
                        shortcutFunctions.setTool_line();
                        whiteboard.mousedown({
                            offsetX: whiteboard.prevPos.x,
                            offsetY: whiteboard.prevPos.y,
                        });
                    } else {
                        shortcutFunctions.setTool_line();
                    }
                }
                whiteboard.pressedKeys["shift"] = true; //Used for straight lines...
            } else if (e.which == 17) {
                strgPressed = true;
            }
            //console.log(e.which);
        });
        $(document).on("keyup", function (e) {
            if (e.which == 16) {
                if (tempLineTool) {
                    tempLineTool = false;
                    shortcutFunctions.setTool_pen();
                    whiteboard.ownCursor.show();
                }
                whiteboard.pressedKeys["shift"] = false;
            } else if (e.which == 17) {
                strgPressed = false;
            }
        });

        //Load keybindings from keybinds.js to given functions
        Object.entries(keybinds).forEach(([key, functionName]) => {
            const associatedShortcutFunction = shortcutFunctions[functionName];
            if (associatedShortcutFunction) {
                keymage(key, associatedShortcutFunction, { preventDefault: true });
            } else {
                console.error(
                    "Function you want to keybind on key:",
                    key,
                    "named:",
                    functionName,
                    "is not available!"
                );
            }
        });

        // whiteboard clear button
        $("#whiteboardTrashBtn")
            .off("click")
            .click(function () {
                // TODO: Find a better way to ask for confirmation
                whiteboard.clearWhiteboard();
            });

        // undo button
        $("#whiteboardUndoBtn")
            .off("click")
            .click(function () {
                whiteboard.undoWhiteboardClick();
            });

        // redo button
        $("#whiteboardRedoBtn")
            .off("click")
            .click(function () {
                whiteboard.redoWhiteboardClick();
            });

        // view only
        $("#whiteboardLockBtn")
            .off("click")
            .click(() => {
                ReadOnlyService.deactivateReadOnlyMode();
            });

        $("#whiteboardUnlockBtn")
            .off("click")
            .click(() => {
                ReadOnlyService.activateReadOnlyMode();
            });

        $("#whiteboardUnlockBtn").hide();
        $("#whiteboardLockBtn").show();

        // switch tool
        $(".whiteboard-tool")
            .off("click")
            .click(function () {
                $(".whiteboard-tool").removeClass(CONSTANTS.ACTIVE_WHITEBOARD_TOOL_CLASSES);
                $(this).addClass(CONSTANTS.ACTIVE_WHITEBOARD_TOOL_CLASSES);
                var activeTool = $(this).attr("tool");
                whiteboard.setTool(activeTool);

                // INFO: Removed active tool and color picker view code

                let savedThickness = localStorage.getItem("item_thickness_" + activeTool);
                if (savedThickness) {
                    whiteboard.setStrokeThickness(savedThickness);
                    $("#whiteboardThicknessSlider").val(savedThickness);
                }
            });

        // upload image button
        document.getElementById("manualFileUpload").addEventListener(
            "change",
            function (e) {
                if (ReadOnlyService.readOnlyActive) return;
                e.originalEvent = { dataTransfer: { files: e.target.files } };
                handleFileUploadEvent(e);
            },
            false
        );
        $("#addImgToCanvasBtn")
            .off("click")
            .click(function () {
                if (ReadOnlyService.readOnlyActive) return;
                document.getElementById("manualFileUpload")?.click();
            });

        // save image as imgae
        $("#saveAsImageBtn")
            .off("click")
            .click(function () {
                whiteboard.getImageDataBase64(
                    {
                        imageFormat: ConfigService.imageDownloadFormat,
                        drawBackgroundGrid: ConfigService.drawBackgroundGrid,
                    },
                    function (imgData) {
                        var w = window.open("about:blank"); //Firefox will not allow downloads without extra window
                        setTimeout(function () {
                            //FireFox seems to require a setTimeout for this to work.
                            var a = document.createElement("a");
                            a.href = imgData;
                            a.download = "whiteboard." + ConfigService.imageDownloadFormat;
                            w.document.body.appendChild(a);
                            a.click();
                            w.document.body.removeChild(a);
                            setTimeout(function () {
                                w.close();
                            }, 100);
                        }, 0);
                    }
                );
            });

        // On thickness slider change
        $("#whiteboardThicknessSlider").on("input", function () {
            if (ReadOnlyService.readOnlyActive) return;
            whiteboard.setStrokeThickness($(this).val());
            let activeTool = $(".whiteboard-tool.active").attr("tool");
            localStorage.setItem("item_thickness_" + activeTool, $(this).val());
        });

        let activeTool = $(".whiteboard-tool.active").attr("tool");
        let savedThickness = localStorage.getItem("item_thickness_" + activeTool);
        if (savedThickness) {
            whiteboard.setStrokeThickness(savedThickness);
            $("#whiteboardThicknessSlider").val(savedThickness);
        }

        // handle drag&drop
        var dragCounter = 0;
        $("#whiteboardContainer").on("dragenter", function (e) {
            if (ReadOnlyService.readOnlyActive) return;
            e.preventDefault();
            e.stopPropagation();
            dragCounter++;
            whiteboard.dropIndicator.show();
        });

        $("#whiteboardContainer").on("dragleave", function (e) {
            if (ReadOnlyService.readOnlyActive) return;

            e.preventDefault();
            e.stopPropagation();
            dragCounter--;
            if (dragCounter === 0) {
                whiteboard.dropIndicator.hide();
            }
        });

        function handleFileUploadEvent(e) {
            e.preventDefault();
            e.stopPropagation();

            if (e.originalEvent.dataTransfer) {
                if (e.originalEvent.dataTransfer.files.length) {
                    var filename = e.originalEvent.dataTransfer.files[0]["name"];
                    if (isImageFileName(filename)) {
                        var blob = e.originalEvent.dataTransfer.files[0];
                        var reader = new window.FileReader();
                        reader.readAsDataURL(blob);
                        reader.onloadend = function () {
                            const base64data = reader.result;
                            uploadImgAndAddToWhiteboard(base64data);
                        };
                    } else if (isPDFFileName(filename)) {
                        //Handle PDF Files
                        var blob = e.originalEvent.dataTransfer.files[0];

                        var reader = new window.FileReader();
                        reader.onloadend = function () {
                            var pdfData = new Uint8Array(this.result);

                            var loadingTask = pdfjsLib.getDocument({ data: pdfData });
                            loadingTask.promise.then(
                                function (pdf) {
                                    console.log("PDF loaded");

                                    var currentDataUrl = null;
                                    var modalDiv = $(
                                        "<div>" +
                                            "Page: <select></select> " +
                                            '<button style="margin-bottom: 3px;" class="modalBtn"><i class="fas fa-upload"></i> Upload to Whiteboard</button>' +
                                            '<img style="width:100%;" src=""/>' +
                                            "</div>"
                                    );

                                    modalDiv.find("select").change(function () {
                                        showPDFPageAsImage(parseInt($(this).val()));
                                    });

                                    modalDiv
                                        .find("button")
                                        .off("click")
                                        .click(function () {
                                            if (currentDataUrl) {
                                                $(".basicalert").remove();
                                                uploadImgAndAddToWhiteboard(currentDataUrl);
                                            }
                                        });

                                    for (var i = 1; i < pdf.numPages + 1; i++) {
                                        modalDiv
                                            .find("select")
                                            .append('<option value="' + i + '">' + i + "</option>");
                                    }

                                    showBasicAlert(modalDiv, {
                                        header: "Pdf to Image",
                                        okBtnText: "cancel",
                                        headercolor: "#0082c9",
                                    });

                                    showPDFPageAsImage(1);

                                    function showPDFPageAsImage(pageNumber) {
                                        // Fetch the page
                                        pdf.getPage(pageNumber).then(function (page) {
                                            console.log("Page loaded");

                                            var scale = 1.5;
                                            var viewport = page.getViewport({ scale: scale });

                                            // Prepare canvas using PDF page dimensions
                                            var canvas = $("<canvas></canvas>")[0];
                                            var context = canvas.getContext("2d");
                                            canvas.height = viewport.height;
                                            canvas.width = viewport.width;

                                            // Render PDF page into canvas context
                                            var renderContext = {
                                                canvasContext: context,
                                                viewport: viewport,
                                            };
                                            var renderTask = page.render(renderContext);
                                            renderTask.promise.then(function () {
                                                var dataUrl = canvas.toDataURL("image/jpeg", 1.0);
                                                currentDataUrl = dataUrl;
                                                modalDiv.find("img").attr("src", dataUrl);
                                                console.log("Page rendered");
                                            });
                                        });
                                    }
                                },
                                function (reason) {
                                    // PDF loading error

                                    showBasicAlert(
                                        "Error loading pdf as image! Check that this is a vaild pdf file!"
                                    );
                                    console.error(reason);
                                }
                            );
                        };
                        reader.readAsArrayBuffer(blob);
                    } else {
                        showBasicAlert("File must be an image!");
                    }
                } else {
                    //File from other browser

                    var fileUrl = e.originalEvent.dataTransfer.getData("URL");
                    var imageUrl = e.originalEvent.dataTransfer.getData("text/html");
                    var rex = /src="?([^"\s]+)"?\s*/;
                    var url = rex.exec(imageUrl);
                    if (url && url.length > 1) {
                        url = url[1];
                    } else {
                        url = "";
                    }

                    isValidImageUrl(fileUrl, function (isImage) {
                        if (isImage && isImageFileName(url)) {
                            whiteboard.addImgToCanvasByUrl(fileUrl);
                        } else {
                            isValidImageUrl(url, function (isImage) {
                                if (isImage) {
                                    if (isImageFileName(url) || url.startsWith("http")) {
                                        whiteboard.addImgToCanvasByUrl(url);
                                    } else {
                                        uploadImgAndAddToWhiteboard(url); //Last option maybe its base64
                                    }
                                } else {
                                    showBasicAlert("Can only upload Imagedata!");
                                }
                            });
                        }
                    });
                }
            }
        }

        $("#whiteboardContainer").on("drop", function (e) {
            //Handle drop
            if (ReadOnlyService.readOnlyActive) return;

            handleFileUploadEvent(e);
            dragCounter = 0;
            whiteboard.dropIndicator.hide();
        });

        if (!localStorage.getItem("savedColors")) {
            localStorage.setItem(
                "savedColors",
                JSON.stringify([
                    "rgba(0, 0, 0, 1)",
                    "rgba(255, 255, 255, 1)",
                    "rgba(255, 0, 0, 1)",
                    "rgba(0, 255, 0, 1)",
                    "rgba(0, 0, 255, 1)",
                    "rgba(255, 255, 0, 1)",
                    "rgba(255, 0, 255, 1)",
                ])
            );
        }

        let colorPickerOnOpen = function (current_color) {
            this._domPalette = $(".picker_palette", this.domElement);
            const palette = JSON.parse(localStorage.getItem("savedColors"));
            if ($(".picker_splotch", this._domPalette).length === 0) {
                for (let i = 0; i < palette.length; i++) {
                    let palette_Color_obj = new this.color.constructor(palette[i]);
                    let splotch_div = $(
                        '<div style="position:relative;"><span position="' +
                            i +
                            '" class="removeColor" style="position:absolute; cursor:pointer; right:-1px; top:-4px;">x</span></div>'
                    )
                        .addClass("picker_splotch")
                        .attr({
                            id: "s" + i,
                        })
                        .css("background-color", palette_Color_obj.hslaString)
                        .on("click", { that: this, obj: palette_Color_obj }, function (e) {
                            e.data.that._setColor(e.data.obj.hslaString);
                        });
                    splotch_div.find(".removeColor").on("click", function (e) {
                        e.preventDefault();
                        $(this).parent("div").remove();
                        palette.splice(i, 1);
                        localStorage.setItem("savedColors", JSON.stringify(palette));
                    });
                    this._domPalette.append(splotch_div);
                }
            }
        };

        const colorPickerTemplate = `
        <div class="picker_wrapper" tabindex="-1">
          <div class="picker_arrow"></div>
          <div class="picker_hue picker_slider">
            <div class="picker_selector"></div>
          </div>
          <div class="picker_sl">
            <div class="picker_selector"></div>
          </div>
          <div class="picker_alpha picker_slider">
            <div class="picker_selector"></div>
          </div>
          <div class="picker_palette"></div>
          <div class="picker_editor">
            <input aria-label="Type a color name or hex value"/>
          </div>
          <div class="picker_sample"></div>
          <div class="picker_done">
            <button>Ok</button>
          </div>
          <div class="picker_cancel">
            <button>Cancel</button>
          </div>
        </div>
      `;

        let colorPicker = null;

        function intColorPicker(initColor) {
            if (colorPicker) {
                colorPicker.destroy();
            }
            colorPicker = new Picker({
                parent: $("#whiteboardColorpicker")[0],
                color: initColor || "#000000",
                onChange: function (color) {
                    whiteboard.setDrawColor(color.rgbaString);
                },
                onDone: function (color) {
                    let palette = JSON.parse(localStorage.getItem("savedColors"));
                    if (!palette.includes(color.rgbaString)) {
                        palette.push(color.rgbaString);
                        localStorage.setItem("savedColors", JSON.stringify(palette));
                    }
                    intColorPicker(color.rgbaString);
                },
                onOpen: colorPickerOnOpen,
                template: colorPickerTemplate,
            });
        }

        intColorPicker();

        let bgColorPicker = null;

        function intBgColorPicker(initColor) {
            if (bgColorPicker) {
                bgColorPicker.destroy();
            }
            bgColorPicker = new Picker({
                parent: $("#textboxBackgroundColorPicker")[0],
                color: initColor || "#f5f587",
                bgcolor: initColor || "#f5f587",
                onChange: function (bgcolor) {
                    whiteboard.setTextBackgroundColor(bgcolor.rgbaString);
                },
                onDone: function (bgcolor) {
                    let palette = JSON.parse(localStorage.getItem("savedColors"));
                    if (!palette.includes(color.rgbaString)) {
                        palette.push(color.rgbaString);
                        localStorage.setItem("savedColors", JSON.stringify(palette));
                    }
                    intBgColorPicker(color.rgbaString);
                },
                onOpen: colorPickerOnOpen,
                template: colorPickerTemplate,
            });
        }

        intBgColorPicker();

        // on startup select mouse
        shortcutFunctions.setTool_mouse();
        // fix bug cursor not showing up
        whiteboard.refreshCursorAppearance();

        if (process.env.NODE_ENV === "production") {
            if (ConfigService.readOnlyOnWhiteboardLoad) ReadOnlyService.activateReadOnlyMode();
            else ReadOnlyService.deactivateReadOnlyMode();

            if (ConfigService.displayInfoOnWhiteboardLoad) InfoService.displayInfo();
            else InfoService.hideInfo();
        } else {
            // in dev
            ReadOnlyService.deactivateReadOnlyMode();
            InfoService.displayInfo();
        }

        // In any case, if we are on read-only whiteboard we activate read-only mode
        if (ConfigService.isReadOnly) ReadOnlyService.activateReadOnlyMode();

        // Show the whiteboard and activate tooltips
        $("body").show();
        setupToolTips();
        $('button[tool="pen"]').click(); // Select the pen as active tool
    });

    //Prevent site from changing tab on drag&drop
    window.addEventListener(
        "dragover",
        function (e) {
            e = e || event;
            e.preventDefault();
        },
        false
    );
    window.addEventListener(
        "drop",
        function (e) {
            e = e || event;
            e.preventDefault();
        },
        false
    );

    function uploadImgAndAddToWhiteboard(base64data) {
        const date = +new Date();
        $.ajax({
            type: "POST",
            url: document.URL.substr(0, document.URL.lastIndexOf("/")) + "/api/upload",
            data: {
                imagedata: base64data,
                wid: whiteboardId,
                date: date,
                at: accessToken,
            },
            success: function (msg) {
                const { correspondingReadOnlyWid } = ConfigService;
                const filename = `${correspondingReadOnlyWid}_${date}.png`;
                const rootUrl = document.URL.substr(0, document.URL.lastIndexOf("/"));
                whiteboard.addImgToCanvasByUrl(
                    `${rootUrl}/uploads/${correspondingReadOnlyWid}/${filename}`
                ); //Add image to canvas
            },
            error: function (err) {
                showBasicAlert("Failed to upload frame: " + JSON.stringify(err));
            },
        });
    }

    // verify if filename refers to an image
    function isImageFileName(filename) {
        var extension = filename.split(".")[filename.split(".").length - 1];
        var known_extensions = ["png", "jpg", "jpeg", "gif", "tiff", "bmp", "webp"];
        return known_extensions.includes(extension.toLowerCase());
    }

    // verify if filename refers to an pdf
    function isPDFFileName(filename) {
        var extension = filename.split(".")[filename.split(".").length - 1];
        var known_extensions = ["pdf"];
        return known_extensions.includes(extension.toLowerCase());
    }

    // verify if given url is url to an image
    function isValidImageUrl(url, callback) {
        var img = new Image();
        var timer = null;
        img.onerror = img.onabort = function () {
            clearTimeout(timer);
            callback(false);
        };
        img.onload = function () {
            clearTimeout(timer);
            callback(true);
        };
        timer = setTimeout(function () {
            callback(false);
        }, 2000);
        img.src = url;
    }

    // handle pasting from clipboard
    window.addEventListener("paste", function (e) {
        if ($(".basicalert").length > 0 || !!e.origin) {
            return;
        }
        if (e.clipboardData) {
            var items = e.clipboardData.items;
            var imgItemFound = false;
            if (items) {
                // Loop through all items, looking for any kind of image
                for (var i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf("image") !== -1) {
                        imgItemFound = true;
                        // We need to represent the image as a file,
                        var blob = items[i].getAsFile();

                        var reader = new window.FileReader();
                        reader.readAsDataURL(blob);
                        reader.onloadend = function () {
                            console.log("Uploading image!");
                            let base64data = reader.result;
                            uploadImgAndAddToWhiteboard(base64data);
                        };
                    }
                }
            }

            if (!imgItemFound && whiteboard.tool != "text" && whiteboard.tool != "stickynote") {
                showBasicAlert(
                    "Please Drag&Drop the image or pdf into the Whiteboard. (Browsers don't allow copy+past from the filesystem directly)"
                );
            }
        }
    });
}

export default main;
