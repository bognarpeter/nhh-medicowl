document.addEventListener('DOMContentLoaded', function() {
  var options = null; //csak, hogy mukodjon
  var elems = document.querySelectorAll('.modal');
  var instances = M.Modal.init(elems, options);
});

function openAddSymptom() {
  var elem = document.getElementById('addSymptomModal');
  var instance = M.Modal.getInstance(elem);
  instance.open();
}

document.addEventListener('DOMContentLoaded', function() {
  var options = null; //csak, hogy mukodjon
  var elems = document.querySelectorAll('.fixed-action-btn');
  var instances = M.FloatingActionButton.init(elems, options);
});
