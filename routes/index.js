// Get Home Page JavaScript File

/* 	
	-- Cloud Assignment 2 -- 
	Name: 	Neil Ramdath
	ID: 	100519195
	------------------------ 
*/


exports.index = function(req, res)
{
  res.render('index', 
  	{ 
  		appTitle: 'Ramblers'
  	});
};
