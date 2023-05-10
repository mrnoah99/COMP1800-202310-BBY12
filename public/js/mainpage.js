function displayNotifs() {
    notifPopup = document.getElementById("notifications");
    if (notifPopup.getAttribute("style") == "display: none;") {
        notifPopup.setAttribute("style", "display: block;");
    } else {
        notifPopup.setAttribute("style", "display: none;")
    }
}