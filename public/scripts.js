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

  $('#create-form-btn').on('click', function() {
    $.ajax({
      type: 'POST',
      url: '/employees',
      data: $('#create-user-form').serialize(),
      success: function() {
        window.location.href = '/employees';
      },
      error: function() {
        alert('Error creating user.');
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


});
