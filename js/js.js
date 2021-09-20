function getTheme () {
    function changeTheme(themeUrl) {
      var elm = document.getElementById("style");
      elm && elm.remove();

      var newCss = document.createElement("link");
      newCss.id = "style";
      newCss.rel = "stylesheet";
      newCss.type = "text/css";
      newCss.href = themeUrl;
      document.head.appendChild(newCss);
    }
    var index = document.getElementById("select").selectedIndex;
    switch (index) {
        case 0: 
          changeTheme('css/tema-lite.css?' + Math.random());
          break;
        case 1: 
          changeTheme('css/tema-principal.css?' + Math.random());
          break;
        case 2: 
          changeTheme('css/tema-escuro.css?' + Math.random());
          break;
        case 3: 
          changeTheme('css/tema-verde.css?' + Math.random());
          break;
        case 4: 
          changeTheme('css/tema-matrix.css?' + Math.random());
          break;
        default:
          changeTheme('css/tema-principal.css?' + Math.random());
          break;
    }
    setTimeout(function() {
        document.getElementById('game-area').focus();
    }, 10);
}

function go_full_screen() {
    var elem = document.documentElement;
    try {
        if (elem.requestFullscreen) {
          elem.requestFullscreen();
        } else if (elem.msRequestFullscreen) {
          elem.msRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
          elem.mozRequestFullScreen();
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
    } catch(err) {
      console.error(err);
      alert("Desculpe, a tela inteira não funciona nesta configuração.");
    }
  }