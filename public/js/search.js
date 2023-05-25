function search() {
    let input = document.getElementById("search-bar").value;
    window.location.href = `/searchresults?search=${input}`;
    console.log("searching...")
}