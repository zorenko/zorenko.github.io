function closeFunct() {
   document.querySelector(".alert").style.display='none';
  }


function toggleDiv(element){

  var el = document.getElementById(element);
  if(el.style.display != 'block')
  {
    el.style.display = 'block';
  }
  else
  {
    el.style.display = '';
  }
}
