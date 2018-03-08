$( function(){

	var createNodes = function(num, radius){
		var nodes = [], 
             width = (radius * 2) + 50,
             height = (radius * 2) + 50,
             angle,
             x,
             y,
             i;
         for (i=0; i<num; i++) {
          angle = (i / (num/2)) * Math.PI; // Calculate the angle at which the element will be placed.
                                                // For a semicircle, we would use (i / numNodes) * Math.PI.
          x = (radius * Math.cos(angle)) + (width/2); // Calculate the x position of the element.
          y = (-radius * Math.sin(angle)) + (width/2); // Calculate the y position of the element.
          nodes.push({x,  y});

         }
         return nodes;
	}

	//put all the ball around the circle
	var CircleR = 160;
	var NodesNum = 8;
	var ballNum = 5;
	document.getElementById("MainBall").style.left = CircleR + "px";
    document.getElementById("MainBall").style.top = CircleR + "px";
	var nodes = createNodes(NodesNum,CircleR);//original pos
	console.log(nodes);
	console.log(nodes[1].x);
	for (var i = 0; i < ballNum; i++){
		document.getElementById("B"+i).style.left = parseInt(nodes[i].x,10)+"px";
		document.getElementById("B"+i).style.top = parseInt(nodes[i].y,10)+"px";
	}
	var notRun = [];
	for(var i = 0; i < ballNum; i++){
		notRun.push(true);
	}
	//var allDistances = [];
	//var isTouch = [];
	//var isMin = [];
	var mainR;
	var mainX;
	var mainY;
	var notBlue = false;

	$('#MainBall').draggable(
	    {

	        drag: function(){
	        	//get main ball attributes
	            var mainOffset = $(this).offset();
	            mainR = parseInt($(this).css("border-radius"),10);
	            mainX = mainOffset.left + mainR;
	            mainY = mainOffset.top + mainR;
	            //$('#posX').text('x: ' + mainX);
	            //$('#posY').text('y: ' + mainY);

	            function getDistance(id){
		            var smallOffset = $(id).offset();
		            var smallR = parseInt($(id).css("border-radius"),10);
		            var idNum = id.split("#B");//get the num from the id string
		            var smallX = parseInt(nodes[idNum[1]].x,10) + smallR;
		            var smallY = parseInt(nodes[idNum[1]].y,10) + smallR;

		            var dx = mainX - smallX;
		            var dy = mainY - smallY;
		            var distance = Math.sqrt(dx * dx + dy * dy);
		            
		            return distance;
				}

			//all distance saved in here
				var allDistances = [];
				for (var i = 0; i < ballNum; i++){
					allDistances.push(getDistance("#B"+i));
				}
				console.log(allDistances);

			//whether touch any ball
				var isTouch = [];
				for (var i = 0; i < ballNum; i++){
					if(allDistances[i] <= (mainR + parseInt($("#B"+i).css("border-radius"),10))){
						isTouch.push(true);
					}
					else{
						isTouch.push(false);
					}
				}
				console.log(isTouch);

			//whether distance is min
				var isMin = [];
				for (var i = 0; i < ballNum; i++){
					if(allDistances[i] == Math.min(...allDistances)){
						isMin.push(true);
					}
					else{
						isMin.push(false);
					}
				}
				console.log(isMin);
				console.log("min distance ="+Math.min(...allDistances));

			//Animation control
			//var notBlue = false;
				 function inAnimation(id){
				 	anime({
							targets: '#B'+id,
							left: (mainX - parseInt($("#B"+id).css("border-radius"),10)) + 'px',
							top: (mainY - parseInt($("#B"+id).css("border-radius"),10)) +'px',
							easing: 'easeInOutQuad',
							duration: 50
						});
				 	anime({
				 		targets:"#MainBall",
				 		background: $("#B"+id).css("background"),
				 		easing: 'easeInOutQuad',
						duration: 80
				 	});
				 	
				 }

				 function outAnimation(id){
				 	
					 	anime({
								targets: '#B'+id,
								left: parseInt(nodes[id].x,10) + 'px',
								top: parseInt(nodes[id].y,10) +'px',
								easing: 'easeInOutQuad',
								duration: 90
							});
				 }
				for( var i = 0; i < ballNum; i++){
					if(isTouch[i] && isMin[i]){
						//inAnimation
						inAnimation(i);
						notRun[i] = true;
						notBlue = true;
					}
					else if((!isTouch[i] || !isMin[i]) && notRun[i]){
						//outAnimation
						outAnimation(i);
						notRun[i] = false;
					}
				}
				var turnBlue;

				for( var i = 0; i < ballNum; i++){
					if(isTouch[i] == false){ turnBlue = true;}
					else{turnBlue = false; break;}
				}
				//console.log("notBlue="+notBlue);
				if(turnBlue && notBlue){//turn to blue
					console.log("turn blue");
					
					anime({
				 		targets:"#MainBall",
				 		background: "#6a89ff",
				 		easing: 'easeInOutQuad',
						duration: 80
				 	});

					notBlue = false;
				}
	        }
	    });
				

});
