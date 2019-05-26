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



$('.create-btn2').on('click', function() {
    window.location.href = '/awards/create';
  });

$('.edit-btn2').on('click', function() {
    var $id = $(this).closest('tr').find('.id').text();
    window.location.href = '/awards/' + $id;
  });

$('#create-form2-btn').on('click', function() {
    $.ajax({
      type: 'POST',
      url: '/awards',
      data: $('#create-award-form').serialize(),
      success: function() {
        window.location.href = '/awards';
      },
      error: function() {
        alert('Error creating award.');
      }
    });
  });

$('#edit-form2-btn').on('click', function() {
    var $id = $('.id').text();
    $.ajax({
      type: 'PUT',
      url: '/awards/' + $id,
      data: $('#edit-award-form').serialize(),
      success: function() {
        window.location.href = '/awards';
      },
      error: function() {
        //alert('Error editing user.');
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
