//jshint esversion:8

$(function () {

  $('.create-btn').on('click', function() {
    window.location.href = '/employees/create';
  });

  // Handle Edit button routing
  $('.edit-btn').on('click', function() {
    var $eid = $(this).closest('tr').find('.eid').text();
    window.location.href = '/employees/' + $eid;
  });

  $('#select-user-type').on('change', function() {
    if (this.value == 0) {
      $('#user-sig').show();
    } else {
      $('#user-sig').hide();
    }
  });

  $('#create-user-form').submit(function(ev) {
    ev.preventDefault();
    var formData = new FormData(this);

    // contentType and processData must be set to false to use FormData object!
    $.ajax({
      type: 'POST',
      url: '/employees',
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
      success: function() {
        alert("Success!");
        window.location.href = '/employees';
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        console.log(XMLHttpRequest);
        console.log(textStatus);
        console.log(errorThrown);
      }
    });
  });

  $('#edit-form-btn').on('click', function() {
    var $eid = $('.eid').text();
    $.ajax({
      type: 'PUT',
      url: '/employees/' + $eid,
      data: $('#edit-user-form').serialize(),
      success: function() {
        window.location.href = '/employees';
      },
      error: function() {
        //alert('Error editing user.');
      }
    });
  });

  $('#edit-name-form').submit(function(ev) {
    ev.preventDefault();
    var formData = new FormData(this);
    var $eid = $('.eid').val();

    console.log($eid);
    $.ajax({
      type: 'PUT',
      url: '/user/' + $eid,
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
      success: function() {
        alert("Success!");
        window.location.href = '/';
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        console.log(XMLHttpRequest);
        console.log(textStatus);
        console.log(errorThrown);
      }
    });
  });

  $('.delete-btn').on('click', function() {
    var $eid = $(this).closest('tr').find('.eid').text();

    $.ajax({
      type: 'DELETE',
      url: '/employees/' + $eid,
      success: function() {
        window.location.href = '/employees';
      },
      error: function() {
        alert('Error deleting user.');
      }
    });
  });

$('.create-btn2').on('click', function() {
    window.location.href = '/awards/create';
  });

  $('#create-award-form').submit(function(ev) {
    ev.preventDefault();
    var formData = new FormData(this);

    // contentType and processData must be set to false to use FormData object!
    $.ajax({
      type: 'POST',
      url: '/awards',
      data: formData,
      cache: false,
      contentType: false,
      processData: false,
      success: function() {
        alert("Success!");
        window.location.href = '/awards';
      },
      error: function(XMLHttpRequest, textStatus, errorThrown) {
        console.log(XMLHttpRequest);
        console.log(textStatus);
        console.log(errorThrown);
      }
    });
  });

$('.delete-btn2').on('click', function() {
    var $id = $(this).closest('tr').find('.id').text();

    $.ajax({
      type: 'DELETE',
      url: '/awards/' + $id,
      success: function() {
        window.location.href = '/awards';
      },
      error: function() {
        alert('Error deleting award.');
      }
    });
  });

});
