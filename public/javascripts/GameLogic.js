// Event Listener
setTimeout(requestLeaderboard,1200);

document.getElementById("startBtn").addEventListener("click", startGame);
document.getElementById("showPopUpBtn").addEventListener("click", showPopUp);
document.getElementById("submitBtn").addEventListener("click", sendScore);
document.getElementById("resetBtn").addEventListener("click", showPopUp);

//###########################
	//#Server Communcation Parts#
	//###########################
	const serverURL = window.location.origin;//"http://localhost:3000";
	
	function sendScore(){
		showPopUp(); //vielleicht auch erst beim erhalten der Daten?
		var sScore = document.getElementById("scoreInput").value;
		var sName = document.getElementById("nameInput").value;
		if (sName == "") {sName = "[noName]";} //In case no name has been entered
		
		//Als JSON Object verpacken
		data = {"name":"","score":""};
		data.name = sName;
		data.score = sScore;
		console.log("data to be send: "+ data.name +" "+data.score);
		
		$.ajax({
			type:"POST",
			async: true,
			url: serverURL+"/sendScore",
			data:data,
			//Im gegensatz zur Form kann man hier den Response abfangen. Anstatt dass es direkt gerendert wird,
			//wird hier in der function bestimmt was damit geschieht (Der response hier ist ein String)
			success: function(dataResponse){
				console.log("success beim senden: ");
				console.log(dataResponse);
				setTimeout(requestLeaderboard,1000);
			},
			statusCode: {
				404: function(){
					alert("not found");
				} //, 300:()=>{}, ...
			}
		});
	}
	
	function requestLeaderboard(){
		$.ajax({
			type:"GET",
			async: true,
			url: serverURL+"/getScore",
			//Im gegensatz zur Form kann man hier den Response abfangen. Anstatt dass es direkt gerendert wird,
			//wird hier in der function bestimmt was damit geschieht (Der response hier ist ein String)
			success: function(dataResponse){
				highScores = JSON.parse(dataResponse);
				
				//Build html String from JSON response
				var leaderBoardString = "<h2>Leaderboard</h2>";
				var tableString = '<table id="table"><tr><th>Name</th><th>Score</th>';	
				for (var i = 0; i < highScores.user.length;i++){
					tableString += "<tr><td>"+highScores.user[i].name+"</td><td>"+highScores.user[i].score+"</td></tr>";
				}
				tableString += '</tr></table>';
				//Update leaderBoard with created table
				document.getElementById("leaderboardArea").innerHTML = leaderBoardString+tableString;
			},
			statusCode: {
				404: function(){
					alert("not found");
				} //, 300:()=>{}, ...
			}
		});
	}
	
	
	
	function showPopUp() {
		var x = document.getElementById("popUpDiv");
		var y = document.getElementById("backgroundDiv");
		
		if (x.style.display === "none") {
			x.style.display = "block";
			y.style.display = "block";
		} else {
			x.style.display = "none";
			y.style.display = "none";
		}
	}
  
  
	//#################
	//#The Game Logic:#
	//#################
	function testDraw(){

	}
	function testClear(){

	}
		
	const cColor="red";
	const cRadius = 20;
	//timer vars
	amountOfSpawns = 0; //To check when to reduce spawnTime
	spawnTimeVariable = 1.2; //Spawn every second to start
	currentTime = 0;
	//handles the spawning times and spawns new circles
	//Basically the GameLoop
	function myTimer(){
		currentTime += 0.05; //in seconds
		currentTime = Math.round(currentTime*100)/100; //round to 2 decimals
		
		if(currentTime >= spawnTimeVariable){
			//Spawn circle
			let randomX = (Math.floor(Math.random()*(myGameArea.canvas.width-cRadius*2))) + cRadius; //number von 2xradius bis width-2xradius //von cRadius(das am Ende) bis canvaswidth-cRadius also von 0 bis 1 + modifer
			let randomY = (Math.floor(Math.random()*(myGameArea.canvas.height-cRadius*2))) + cRadius;
			myGameArea.allCircles.push(new componentCircle(cRadius,cColor,randomX,randomY)); //spawnCircle
			updateGameArea();
			
			amountOfSpawns += 1;
			currentTime = 0;
		}
		
		//every 2 spawns reduce time by 0.1. If its at 0.1 spawningTime only reduce once more after 5 spawns
		if((amountOfSpawns >= 2 && spawnTimeVariable > 0.1) || (amountOfSpawns >= 25 && spawnTimeVariable > 0.05)){
			amountOfSpawns = 0; //reset spawns
			spawnTimeVariable = spawnTimeVariable - 0.1; //reduce spawnTime Variable
			spawnTimeVariable = Math.round(spawnTimeVariable*100)/100; //Round to 2 decimals
		}
	}
	//
	

	function startGame(){
		//timer vars resetten
		amountOfSpawns = 0; //To check when to reduce spawnTime
		spawnTimeVariable = 2; //Spawn every second to start
		currentTime = 0;
		
		console.log("starting");
		clearInterval(myGameArea.intervalTimer); //clear existing interval
		myGameArea.start();
		//updateGameArea();
	}
  
	//Updates all elements, so that moving elements actually move
	function updateGameArea(){
		if(myGameArea.running){
			myGameArea.clear();
			myGameArea.allCircles.forEach((circle) => circle.update());
			
			//highscore und lifes anpassen
			document.getElementById("lifes").innerHTML = "Lifes: "+myGameArea.lifes;
			document.getElementById("highscore").innerHTML = "Points: "+myGameArea.highscore;
			
			//Check for Game Over
			if(myGameArea.lifes <= 0){
				myGameArea.running = false;
				clearInterval(myGameArea.intervalTimer);
				//clearInterval(myGameArea.intervalGame);
				//alert("Game over! Score: "+myGameArea.highscore);
				
				showPopUp();
				document.getElementById("scoreInput").value = myGameArea.highscore;
				document.getElementById("canvasArea").innerHTML = "";
			}
		}
	}
	
	
	//######################
	//GameArea Object mit canvas und start functionen
	//beinhaltet außer dem die geamte GameLogic (highscore,lifes etc.)
	var myGameArea = {
		canvas : document.createElement("canvas"), 
		//start Function to set Canvas and get the context of it (for drawing)
		start : function() {
			this.running = true;
			this.canvas.setAttribute("id","myCanvas");
			this.canvas.width = (960/1.8);
			this.canvas.height = (520/1.5);
			this.context = this.canvas.getContext("2d");
			//Background Color
			this.context.fillStyle="#CCCCCC";
			this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
			
			document.getElementById("canvasArea").appendChild(this.canvas); //canvas in die div einfügen
			
			//Gameplay Info
			this.lifes=10;
			this.highscore = 0; //Score wäre passender, aber egal...
			this.allCircles = [];
			
			
			//Start GameLoops der IntervalTimer ist die GameLoop, updateGameArea wird immer manuell aufgerufen wenn sich was geändert hat.
			//this.intervalGame = setInterval(updateGameArea, 50); // 20 millisekunden interval //Nur bei animierten objecten nötig
			this.intervalTimer = setInterval(myTimer, 50);
		},
		clear : function(){
			this.context.clearRect(0, 0, this.canvas.width, this.canvas.height); //start X,Y ende X,Y
			//Background color neu zeichnen
			this.context.fillStyle="#CCCCCC";
			this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
		}
	}
	
	//###################
	//constructor function to create a circle
	function componentCircle(rad, color, x, y) {
	//start=0, end=2*Math.PI,
		let _this = this;
	  this.rad = rad;
	  this.start = 0;
	  this.end = 2*Math.PI;
	  this.x = x;
	  this.y = y;
	  this.color = color;
	  
	  this.update = function(){
		  ctx = myGameArea.context;
		  ctx.fillStyle = this.color;
		  ctx.arc(this.x, this.y, this.rad, this.start, this.end);
		  ctx.stroke();
		  ctx.fill();
		  //Pfad neu beginnen und schließen, damit keine "Ghosts" vom alten Pfad bleiben
		  ctx.beginPath();
		  ctx.closePath();  
	  },
	  this.despawn = function(){
		for(i = 0; i<myGameArea.allCircles.length;i++){
			if(myGameArea.allCircles[i] == this){
				//dieses Element aus dem Array entfernen
				myGameArea.allCircles.splice(i,1);
				//updaten nachde er nicht mehr im Array ist, entfernt ihn vom Canvas
				updateGameArea();
				//die timeouts beenden
				clearTimeout(_this.timeout1);
				clearTimeout(_this.timeout2);
				
				//vermutlich nicht nötig
				delete _this;
			}
		}
	  },
	  //If circle is clicked
	  this.clicked = function(){
		_this.despawn();
		//Change Font of score as signal
		document.getElementById("highscore").style.color = "green";
		document.getElementById("highscore").style.fontWeight = "bold";
		setTimeout(resetHighscoreFont,250);
		
		myGameArea.highscore +=1;
		updateGameArea();
		console.log("new Score: "+myGameArea.highscore);
	  },
	  //Handling despawning if time is up
	  this.notClickedInTime = function(){
		_this.despawn();

		//Change font of lifes as signal
		document.getElementById("lifes").style.color = "red";
		document.getElementById("lifes").style.fontWeight = "bold";
		setTimeout(resetLifeFont,250);
		
		myGameArea.lifes -= 1;
		updateGameArea();
		console.log("new lifes: "+myGameArea.lifes);
		
	  },
	  this.almostOutOfTime = function(){
		_this.color = "blue";
		updateGameArea();
	  }
	  this.timeout1 = setTimeout(this.notClickedInTime,1200); //nach 1.5 sek verschwindet der Kreis 
	  this.timeout2 = setTimeout(this.almostOutOfTime,1000); //Farbwechsel, als Signal, dass der Kreis gleich verschwindet
	}  
	//###################
	
	//Click Handler (e = das event)
	myGameArea.canvas.addEventListener('click',(e) => {
		var mousePos = {
			x: e.clientX,
			y: e.clientY
		};
		//console.log("Mouse pos at: "+mousePos.x+"|"+mousePos.y);
		//check if it intersects
		myGameArea.allCircles.forEach(function(circle){
			if(isIntersect(mousePos,circle)){
				circle.clicked();
			};
		});
	},false);
	
	//Mathe um zu bestimmen ob ein Punkt (x,y) in einem Kreis (definiert bei x y and radius) ist.
	function isIntersect(point, circle) {
		//Get offset of the canvas element compared to the screen, since the point coordinates are in screen dimensions but circle in canvas dimensions
		canvasYOffset = window.scrollY + document.querySelector('#myCanvas').getBoundingClientRect().top // Y
		canvasXOffset = window.scrollX + document.querySelector('#myCanvas').getBoundingClientRect().left // X
		yScrollOffset = window.scrollY;
		return Math.sqrt( Math.pow((point.x-(circle.x + canvasXOffset)),2) + Math.pow((point.y - (circle.y + canvasYOffset - yScrollOffset)),2) ) < circle.rad; //if Euclid Distance to center < circle.radius
	}
	
	function resetHighscoreFont(){
		document.getElementById("highscore").style.color = "";
		document.getElementById("highscore").style.fontWeight = "normal";
	}
	function resetLifeFont(){
		document.getElementById("lifes").style.color = "";
		document.getElementById("lifes").style.fontWeight = "normal";
	}