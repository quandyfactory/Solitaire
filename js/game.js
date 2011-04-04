// global variables
var __description__ = 'I hacked up a solitaire game in HTML, CSS and JavaScript with jQuery and (almost) no images.\n \nFor now it follows the simplest Klondike rules: turn one card at a time, with no limit on passes through the deck.';
var __version__ = 0.11;
var __author__ = 'Ryan McGreal';
var __releasedate__ = '2011-04-04';
var __homepage__ = 'http://quandyfactory.com/projects/74/solitaire';
var __copyright__ = '(C) 2011 by Ryan McGreal';
var __licence__ = 'GNU General Public Licence, Version 2';
var __licence_url__ = 'http://www.gnu.org/licenses/old-licenses/gpl-2.0.html';

var margin = 10; // normal space between objects on the board
var padding = 2; // normal padding inside an object
var width = 60 + (padding * 2) + margin; // width of a card bed + margin
var width = 54 + (padding * 2) + margin; // width of a card bed + margin

var height = 100 + (padding * 2) + margin; // height of a card bed + margin
var height = 84 + (padding * 2) + margin; // height of a card bed + margin

var suits = 'hearts diams clubs spades'.split(' ');
var vals = 'A 2 3 4 5 6 7 8 9 10 J Q K'.split(' ');
var zIndex = 51; // initialize zIndex so we can always put cards on top of each other
var score = 0; // increment by 1 each time you put a card on the foundation, decrement by 1 when you remove a card

var debugMode = false; // set to true to send details to console.log

// create and shuffle a new deck
var deck = makeDeck(); 
deck = shuffle(deck); 

$(document).ready(function(){
 	$('#board').noisy({
		intensity: 0.9,
		size: 200,
		opacity: 0.1,
		monochrome: false
	});
	deck = startGame(deck);
	
	playGame(deck);
	
});

function startGame(deck) {
	// sets up a game and starts it
	
	// clear the board
	$('#board').html('');
	
	addTools();
	addScore();
	
	// add foundations
	addFoundation();
	addPlayingArea();
	addStockWaste();
	
	// load the cards into the stock
	loadCards(deck);
	
	// deal the cards onto the playing area
	deck = deal(deck);

	return deck;
}

function addTools() {
	// adds restart and redeal buttons
	$('#board').append($('<div id="tools"></div>'));
	$('#tools').append($('<button id="restart" title="Start this game over again">Restart</button>'));
	$('#tools').append($('<button id="redeal" title="Shuffle the deck and start a new game">New Game</button>'));
	$('#tools').append($('<button id="instructions" title="Instructions on how to play the game">Instructions</button>'));
	$('#tools').append($('<button id="about" title="About this game">About</button>'));
	$('#restart').click(restart); 
	$('#redeal').click(redeal); 
	$('#about').click(about);
	$('#instructions').click(instructions);
}

function instructions() {
	// adds an overlay with instructions on how to play the game
	$('#about_pane').remove(); // just in case
	var output = [];
	output.push('<div id="instructions_pane" title="Click on this pane to close it.">');
	output.push('<h2>Instructions</h2>');
	output.push('<ul>');
	output.push('<li>The object is to move all the cards face-up into the <strong>foundation</strong> (the four empty beds on the top right of the board) in ascending order by suit.</li>');
	output.push('<li>The <strong>stock</strong> is the pile of face-down cards in the top left corner.</li>');
	output.push('<li>The <strong>waste</strong> is the spot next to the deck where you can turn cards up.</li>');
	output.push('<li>The <strong>playing area</strong> is the seven groups of cards along the bottom.</li>');
	output.push('<li>Click-and-hold to drag a face-up card on top of another card or into an empty bed.</li>');
	output.push('<li>Only an Ace can go onto an empty foundation bed.</li>');
	output.push('<li>Only a King can go onto an empty playing area bed.</li>');
	output.push('<li>You can only drag a face-up card onto another face-up card in the playing area if the card beneath is the opposite colour and the next number up. E.g. you can drag a 5 of hearts onto a 6 of clubs.</li>');
	output.push('<li>Click a face-down card in the stock to turn it over into the waste. Cards in the stock turn over one at a time, with no limit on passes through the deck.</li>');
	output.push('<li>Click the empty stock to turn the cards back from the waste.</li>');
	output.push('<li>Click a face-fown card in the playing area to turn it over, as long as there is no card on top of it.</li>');
	output.push('<li>Double-click a card to move it onto the foundation automatically if it can go there.</li>');
	output.push('<li>If you want to start over with the same hand, click the "Restart" button.</li>');
	output.push('<li>If you want to shuffle and redeal the cards, click the "New Game" button.</li>');
	output.push('</ul>');
	$('body').append($(output.join('\n')));
	$('#instructions_pane')
		.mouseenter(function() {
			$('#instructions_pane').css('cursor', 'pointer');
		})
		.click(function() {
		$('#instructions_pane').remove();
	});
}	
	
function about() {
	// adds an overlay explaining about the game
	$('#instructions_pane').remove(); // just in case
	var output = [];
	output.push('<div id="about_pane" title="Click on this pane to close it.">');
	output.push('<h2>About this Game</h2>');
	output.push('<p>'+__description__.replace('\n', '<br>')+'</p>');
	output.push('<ul>');
	output.push('<li>Author: '+__author__+'</li>');
	output.push('<li>Copyright: '+__copyright__+'</li>');
	output.push('<li><a target="_blank" href="'+__licence_url__+'">'+__licence__+'</a></li>');
	output.push('<li>Version: '+__version__+', released '+__releasedate__+'</li>');
	output.push('<li>Homepage: <a target="_blank" href="'+__homepage__+'">'+__homepage__+'</a></li>');
	output.push('</ul>');
	output.push('</div>');
	
	$('body').append($(output.join('\n')));
	$('#about_pane')
		.mouseenter(function() {
			$('#about_pane').css('cursor', 'pointer');
		})
		.click(function() {
		$('#about_pane').remove();
	});
}

function addScore() {
	// adds a score notification to the board
	score = 0; // reset score
	$('#board').append($('<div id="score">Score: '+score+'</div>'));
}

function updateScore() {
	// updates the score notification
	$('#score').html('Score: '+score);
	if (score == 52) {
		var answer = confirm('You won the game! Click OK to deal a new hand.');
	}
	log('score='+ score);
}

function redeal() {
    // reshuffles the deck and deals a new hand
    deck = makeDeck();
    deck = shuffle(deck);
    deck = startGame(deck);
    playGame(deck);
    notify('You started a new game.');
}

function restart() {
    // redeals the currently shuffled deck
    deck = startGame(deck);
    playGame(deck);
    notify('You restarted this game.');
}

function addFoundation() {
	// adds the foundation beds, where the cards end up sorted by suit and ascending from Ace
	for (var i=0; i<4; i++) {
		var distFromLeft = 204;
		var thiswidth = distFromLeft + (width*i) + margin;
		$('#board').append($('<div class="bed" title="Foundation" id="foundation_' + i + '" style="top: ' + margin + 'px; left: ' + thiswidth + 'px;"></div>'));
		var thisPos = $('#foundation_'+i).position();
		log('foundation_'+i+' - ' + thisPos.left + ', ' + thisPos.top);
	}
}

function addPlayingArea() {
	// add the playing area beds, where the cards are dealt
	for (var i=0; i<7; i++) {
		var thiswidth = (width*i) + margin;
		var thisheight = height + margin;
		$('#board').append($('<div class="bed" title="Playing Area" id="play_' + i + '" style="top: ' + thisheight + 'px; left: ' + thiswidth + 'px;"></div>'));
	}
}

function addStockWaste() {
	// add the stock and waste beds
	for (var i=0; i<2; i++) {
		var thiswidth = (width*i) + margin;
		if (i == 0) {
			var thisId = 'stock';
		} else {
			var thisId = 'waste';
		}
		$('#board').append($('<div class="bed" title="' + pcase(thisId) + '" id="' + thisId + '" style="top: ' + margin + 'px; left: ' + thiswidth + 'px;"></div>'));
	}
}

function makeDeck() {
	// creates and returns a deck of cards
	var deck = [];
	var id = 0;
	for (var s=0; s<suits.length; s++) {
		for (var v=0; v<vals.length; v++) {
			var colour = 'red';
			if ((suits[s] === 'clubs') || (suits[s] === 'spades')) {
				colour = 'black';
			}
			deck.push({ 
				'suit': suits[s], 
				'suitNum': s,
				'val': vals[v], 
				'valNum': v+1, // for comparing values on a drop
				'colour': colour, 
				'face': 'down',
				'zIndex': 0, // initialize - wil set later
				'id': 'card-' + id, // keep deck cards and divs epiphenomenal
				'idNum': id, // keep string and int version of id
				'posX': 0, // initialize - will set later
				'posY': 0, // initialize - will set later
				'location': 'new', // locations are: new, stock, waste, play, foundation
				'parentId': -1, // used for cards placed on other cards; -1 means unstacked
				'childId': -1 // used for cards placed on other cards; -1 means no child
			});
		log('in makeDeck(); id=' + id + ', s=' + s + ', v=' + v);
		id += 1;
		}
	}
	return deck;
}

function shuffle(deck) {
	// shuffles a deck of cards
	// uses Fisher-Yates shuffle algorithm. Source: http://sedition.com/perl/javascript-fy.html
	var i = deck.length;
	if (i == 0) {
		return deck;
	}
	while ( --i ) {
		var j = Math.floor( Math.random() * ( i + 1 ) );
		var tempi = deck[i];
		var tempj = deck[j];
		deck[i] = tempj;
		deck[j] = tempi;
	}
	 // reset id and idNum after shuffling
	for (var i=0; i<deck.length; i++) {
		deck[i].id = 'card-'+i;
		deck[i].idNum = i;
	}
	return deck;
}

function loadCards(deck) {
	// loads the cards onto the stock before dealing
	for (var i=0; i<deck.length; i++) {
		$('#board').append(
			$('<div class="card" style="top: ' + margin + 'px; left: ' + margin + 'px;"></div>')
			.css('color', deck[i].colour)
			.css('zIndex', i)
			.attr('id', 'card-'+i)
			.css('position', 'absolute')
		);
		$('#card-'+i).unbind(); // remove any event handlers from before
		log('in loadCards(); unbinding events from card-'+i);
		deck[i].posX = margin;
		deck[i].posY = margin;
		deck[i].location = 'stock';
		deck[i].face = 'down';
		deck[i].zIndex = i;
		deck[i].parentId = -1;
		deck[i].childId = -1;
		log('in loadCards(); card-' + i+ '; '+ printObject(deck[i]));
	}
}

function deal(deck) {
	// deals a deck onto the playing area
	log(' ');
	log('Dealing the deck...');
	log(' ');
	var cardIndex = 51; // start counting down
	for (var mainLoop=7; mainLoop>0; mainLoop--) {
		var thisTop = height + margin * (7 - mainLoop + 1);
		var thisLeft = width * (7 - mainLoop) + margin;
		zIndex += 1;
		$('#card-'+cardIndex)
			.css('background', 'white')
			.css('top', thisTop + 'px')
			.css('left', thisLeft + 'px')
			.css('z-index', zIndex)
			.html(deck[cardIndex].val + '&' + deck[cardIndex].suit + ';');
		deck[cardIndex].zIndex = zIndex;
		deck[cardIndex].posX = thisLeft;
		deck[cardIndex].posY = thisTop;
		deck[cardIndex].location = 'play';
		log('in deal(); card-' + cardIndex + ', ' + printObject(deck[cardIndex]));
		deck[cardIndex].face = 'up';
		cardIndex -= 1;
		for (var i=cardIndex; i>cardIndex-mainLoop+1; i--) {
			zIndex += 1;
			var thisLeft = (width*(cardIndex-i+7-mainLoop+1)) + margin;
			$('#card-'+i).css('top', thisTop + 'px').css('left', thisLeft + 'px').css('z-index', zIndex);
			deck[i].zIndex = zIndex;
			deck[i].posX = thisLeft;
			deck[i].posY = thisTop;
			deck[i].location = 'play';
			log('(in deal(); card-' + i + ', ' + printObject(deck[i]));
		}
		cardIndex -= mainLoop-1;
	}
	return deck;	
}

function playGame(deck) {
    // main function to enable game play
	for (i=0; i < deck.length; i++) {

		// handle cards that are facing up
		if (deck[i].face == 'up') { 
			log('in playGame(); Card is face-up:'+ i+'; '+ printObject(deck[i]));
			makeDraggable('card-'+i); // add the draggable event handler

		// handle cards that are facing down
		} else { 
			log('in playGame(); Card is face-down: id ='+ i+ ', ' + printObject(deck[i]));
			// add click handlers to the cards in the stock
			if (deck[i].location == 'stock') { // click on a card in the stock to move it to the waste
				log('in playGame(); Card in stock: id ='+ i+ ', '+ printObject(deck[i]));
				var thisId = i;
				$('#card-'+i)
					.mouseenter(function() {
						$(this)
						    .css('cursor', 'pointer')
						    .attr('title', 'Click on this card to turn it over');
					})
					.click(turnStock);
					
			} else if (deck[i].location == 'play') { // turned-down card in play
			    var thisId = i;
				$('#card-'+i)
					.mouseenter(function() {
						$(this)
						    .css('cursor', 'pointer')
						    .attr('title', 'Click on this card to flip it');
					})
					.click(flipCard);
			}
		}
	}
	// click on the empty stock and restore the cards from the waste
	$('#stock')
	    .mouseenter(function() {
			$(this).css('cursor', 'pointer');
		})
    	.click(restoreStock);
}

function makeDraggable(id) {
    // implements the functionality to make a card draggable
	$('#'+id)
    .mouseenter(function() {
		$(this)
		.css('cursor', 'pointer')
		.attr('title', 'Click and drag this card to another location');
	})
	.draggable({ 
		delay: 50,
		opacity: 0.8, 
		zIndex: 1000000, 
		containment: 'parent', 
		// revert: true,
		stop: dragStop
	});
	
	// don't forget to add the doubleclick event handler as well
	makeDblClick(id);
}

function makeDblClick(id) {
	// adds an event handler to double-click and auto-move into the foundation if applicable
	$('#'+id)
		.dblclick(function() {
			thisIdNum = parseInt(this.id.replace('card-',''));
			console.log('dblclick fired on '+ id);
			var thisTop = 20;
			var thisLeft = [224, 292, 360, 428];
			for (i=0;i<thisLeft.length;i++) {
				var elem = document.elementFromPoint(thisLeft[i], thisTop);
				console.log('foundation id: ' + elem.id + ', substring: ' + elem.id.substring(0,10));
				if (elem.id.substring(0,10) == 'foundation' && deck[thisIdNum].val == 'A') {
					log('in makeDblClick(); the '+deck[thisIdNum].val+' of '+deck[thisIdNum].suit+' moves to '+elem.id+'.');
					moveFoundation('ace', this.id, elem.id);
					
					break;
				} else { // there's a card on the foundation
					var thisElemNum = parseInt(elem.id.replace('card-',''));
					if (deck[thisIdNum].suit == deck[thisElemNum].suit && deck[thisIdNum].valNum == deck[thisElemNum].valNum+1) {
						log('in makeDblClick(); the '+deck[thisIdNum].val+' of '+deck[thisIdNum].suit+' moves to '+elem.id+'.');
						moveFoundation('', this.id, elem.id);
						break;
					}
				}
			}
		});
}


function dragStop() {
    // controls what happens when you stop dragging a card
	// TODO: big hairy function should be broken up into discrete functions
	var this_id = this.id;
	var this_card = deck[parseInt(this_id.replace('card-', ''))];
	log('in dragStop(); Card moved: '+ printObject(this_card));
	
	// look to see if there is a card under the drop spot
	var pos = $('#'+this_id).position();
	$('#'+this_id).css('display', 'none'); // hide card to search beneath it
	var elem = document.elementFromPoint(pos.left+20, pos.top+20);
	var elem_id = elem.id;
	var elem_class = $('#'+elem_id).attr('class');
	log(elem_id.substring(0,5));
	
	// trying to place a card on another card
	if (elem_id.substring(0,5) == 'card-') { 
		var under_card = deck[parseInt(elem_id.replace('card-',''))];
		log('in dragStop(); under_card: '+ printObject(under_card));
		
		// test whether the drop is valid
		
		// trying to put a card on another card in the playing area
		if ( 
				under_card.face == 'up' // card under must be face up
				&& under_card.location == 'play' // card is in play, not in the foundation
				&& this_card.colour != under_card.colour  // colours must be opposite
				&& this_card.valNum == under_card.valNum - 1 // card must be one less than card under
			) {

            putCardOnCard(this_card.id, under_card.id);
			
		// trying to put a card on another card in the foundation area
		} else if ( 
				under_card.face == 'up' // card under must be face up
				&& under_card.location == 'foundation' // card is in foundation
				&& this_card.suit == under_card.suit // same suit
				&& this_card.valNum == under_card.valNum + 1 // card must be one more than card under
			) {

			moveFoundation('', this_card.id, under_card.id);
		
		// card isn't turned up
		} else if (under_card.face == 'down') { 
			$(this).css('top', this_card.posY).css('left', this_card.posX);

			notify('You cannot place your card on a card that has not been turned up yet.');
			
		} else {
			$(this).css('top', this_card.posY).css('left', this_card.posX);

			notify('You cannot place the ' + displayVal(this_card.val) + ' of ' + displaySuit(this_card.suit) + ' on the ' + displayVal(under_card.val) + ' of ' + displaySuit(under_card.suit) + '.');

		}
		
	// trying to place a card on a bed
	} else if (elem_class == 'bed') { 
		log('elem_id='+ elem_id+ ', elem_class ='+ $('#'+elem_id).attr('class'));
		
		// trying to put an ace on an empty foundation
		if (elem_id.substring(0,10) == 'foundation' // the bed needs to be a foundation bed
			&& this_card.val == 'A' // the card needs to be an ace, duh
			) {
			
			moveFoundation('ace', this_card.id, elem_id);
		
		// trying to put something other than an ace on the empty foundation
		} else if ( 
				elem_id.substring(0,10) == 'foundation' 
			) {
			$(this).css('top', this_card.posY).css('left', this_card.posX);							

			notify('You cannot place the ' + displayVal(this_card.val) + ' of ' + displaySuit(this_card.suit) + ' directly on the foundation.');

        // trying to put a king on a play bed
		} else if ( 
				elem_id.substring(0,5) == 'play_' // the bed has to be a play bed
				&& this_card.val == 'K' // the card needs to be a king
			) {

			this_card.posX = parseInt($('#'+elem_id).css('left').replace('px', ''));
			this_card.posY = parseInt($('#'+elem_id).css('top').replace('px', ''));
			if (this_card.location == 'foundation') { // don't forget to decrement score if moving a king off the foundation
				score -= 1;
				updateScore();
			}
			this_card.location = 'play';
			log(printObject(this_card));
			$(this).css('left', this_card.posX).css('top', this_card.posY);

			notify('You placed the ' + displayVal(this_card.val) + ' of ' + displaySuit(this_card.suit) + ' into an empty playing area.');
			
			// need to check whether any cards are on the king, i.e. another card has the king's id as a parentId
			for (var check=0; check<deck.length; check++) {
				if (deck[check].parentId == this_card.id) {
					putCardOnCard(deck[check].id, this_card.id); // recursive so it will capture any other cards below
					break;
				}
			}
			
		// trying to put something other than a king on a play bed
		} else if ( 
				elem_id.substring(0,5) == 'play_' // the bed is a play bed
			) {

			$(this).css('top', this_card.posY).css('left', this_card.posX);							

			notify('You cannot place the ' + displayVal(this_card.val) + ' of ' + displaySuit(this_card.suit) + ' directly on the playing area.');
			
		}
		
	// trying to place a card somewhere else on the board
	} else { 
		log('elem_id ='+ elem_id+ ', elem_class='+ $('#'+elem_id).attr('class'));
		$(this).css('top', this_card.posY).css('left', this_card.posX);

		notify('You cannot place a card elsewhere on the board.');
		
	}
	log('in dragStop(); elem_id='+elem_id+', '+ pos.left+', '+ pos.top);
	$('#'+this_id).css('display', 'block'); // restore visibility after hiding
}

function findCardFromId(id) {
    // returns an object from the deck with a given id
    for (var i=0; i<deck.length; i++) {
        if (deck[i].id == id) {
            return i;
        }
    }
    return false;
}

function moveFoundation(which, card_id, elem_id) {
	// moves a card from the playing area to the foundation
	if (which == 'ace') {
		var deckId = parseInt(card_id.replace('card-', ''));
		var this_card = deck[deckId];
		this_card.posX = $('#'+elem_id).css('left');
		this_card.posY = $('#'+elem_id).css('top');
		log('in moveFoundation(); deckId='+deckId+', card_id='+card_id+', elem_id='+elem_id+', deckId='+ deckId + ', this_card.posX='+this_card.posX+', this_card.posY='+ this_card.posY);
		this_card.location = 'foundation';
		this_card.parentId = -1;
		$('#'+card_id)
			.css('left', this_card.posX)
			.css('top', this_card.posY)
			.unbind('dblclick');
		score += 1;
		log('score='+ score);
		updateScore();
		notify('You placed the ' + displayVal(this_card.val) + ' of ' + displaySuit(this_card.suit) + ' into the foundation.');
		return;

	} else {

		var cardIdNum = parseInt(card_id.replace('card-', ''));
		var underIdNum = parseInt(elem_id.replace('card-', ''));
		var this_card = deck[cardIdNum];
		var under_card = deck[underIdNum];
		this_card.posX = under_card.posX;
		this_card.posY = under_card.posY;
		this_card.location = 'foundation';
		$('#'+this_card.id)
			.css('left', this_card.posX)
			.css('top', this_card.posY)
			.css('zIndex', under_card.zIndex+1)
			.unbind('dblclick');
		this_card.zIndex = under_card.zIndex + 1;
		$('#'+this_card.id).css('zIndez', this_card.zIndex);
		this_card.parentId = under_card.id;
		this_card.parentId = -1;
		for (var check=0; check< deck.length; check++) {
			if (deck[check].childId == this_card.id) {
				deck[check].childId = -1; // detach parent cards
				break;
			}
		}
		score += 1;
		log('score='+ score);
		updateScore();
		notify('You placed the ' + displayVal(this_card.val) + ' of ' + displaySuit(this_card.suit) + ' into the foundation.');
	}
}

function putCardOnCard(this_card_id, under_card_id) {
	// place a card on another card in the playing area
	// NOT for use placing a card on a card in the foundation
    log('in putCardOnCard(); this_card_id='+ this_card_id+', under_card_id='+ under_card_id);
    // puts a card on another card in the playing area
    
    var this_card = deck[findCardFromId(this_card_id)];
    var under_card = deck[findCardFromId(under_card_id)];
    log('in putCardOnCard(); top card BEFORE: '+ this_card_id+', '+ findCardFromId(this_card_id)+', '+ printObject(this_card));
    log('in putCardOnCard(); under card BEFORE: '+ under_card_id+', '+ findCardFromId(under_card_id)+', '+ printObject(under_card));
	
	this_card.posX = under_card.posX;
	this_card.posY = under_card.posY+20;
	this_card.zIndex = under_card.zIndex + 1;
	if (this_card.location == 'foundation') {
		score -= 1; // decrement score when taking a card out of the foundation
		updateScore(); // update the displayed score
	}
	this_card.location = 'play'; // for cards moved from the waste or the foundation
	$('#'+this_card_id)
	    .css('left', this_card.posX)
	    .css('top', this_card.posY)
	    .css('zIndex', this_card.zIndex);
	log('in putCardOnCard(); <div id="'+this_card_id+'">: left='+ $('#'+this_card_id).css('left')+ ', top='+ $('#'+this_card_id).css('top')+ ', zIndex='+ $('#card-'+this_card_id).css('zIndex'));

	this_card.parentId = under_card.id;
	under_card.childId = this_card.id;

	notify('You placed the ' + displayVal(this_card.val) + ' of ' + displaySuit(this_card.suit) + ' on the ' + displayVal(under_card.val) + ' of ' + displaySuit(under_card.suit) + '.');

    log('in putCardOnCard(); top card AFTER: '+ this_card_id+', '+ findCardFromId(this_card_id)+', '+ printObject(this_card));
    log('in putCardOnCard(); under card AFTER: '+ under_card_id+', '+ findCardFromId(under_card_id)+', '+ printObject(under_card));	
	
    if (this_card.childId != -1) {
        // gettin' all recursive in yo biznitch
        putCardOnCard(this_card.childId, this_card.id)
    }

}

function turnStock() {
    // turn a card from the stock onto the waste
	var thisId = parseInt(this.id.replace('card-', ''));
	// first, get the id of the waste
	var thisWaste = document.elementFromPoint(88, 20);
	var thisZindex = $('#'+thisWaste.id).css('zIndex');
	if (thisZindex == 'auto') {
	    thisZindex = 1;
	} else {
	    thisZindex = parseInt(thisZindex);
	}
	// now update the card properties in the deck
	deck[thisId].zIndex = thisZindex + 1;
	deck[thisId].posX = 78;
	deck[thisId].posY = 10;
	deck[thisId].face = 'up';
	deck[thisId].location = 'waste';
	// now update the div corresponding to the card
	$(this)
		.css('left', deck[thisId].posX+'px')
		.css('top', deck[thisId].posY+'px')
		.css('background', 'white')
		.css('zIndex', deck[thisId].zIndex)
		.html(deck[thisId].val + '&' + deck[thisId].suit + ';');
	makeDraggable(this.id);

	// don't forget to remove the click event handler from when it was on the stock
	$(this).unbind('click');
	
	notify('You moved the ' + displayVal(deck[thisId].val) + ' of ' + displaySuit(deck[thisId].suit) + ' from the stock to the waste.');
}

function flipCard() {
    // this flips over a turned-down card in the play area
    var thisId = parseInt(this.id.replace('card-', ''));
    // make sure there aren't any cards on top of this card
    var elem = document.elementFromPoint(deck[thisId].posX+10, deck[thisId].posY+30);
    log('this.id = '+this.id+ ', deck[thisId].posX+10='+ deck[thisId].posX+10+', deck[thisId].posY+30='+ deck[thisId].posY+30+ ', elem.id='+ elem.id);

    if (elem.id == this.id) {
        deck[thisId].face = 'up';
        log(deck[thisId]);
        $('#'+this.id)
            .css('background', 'white')
            .html(deck[thisId].val + '&' + deck[thisId].suit + ';');
        makeDraggable(this.id);
    
        notify('You flipped over the ' + displayVal(deck[thisId].val) + ' of ' + displaySuit(deck[thisId].suit) + '.');
    
    } else {
        notify('You cannot flip a card that is covered by another card.');
    }
}

function notify(message) {
    // sends a message to the notification area
    $('#notification').html(message).fadeOut('fast').fadeIn('slow');
}

function restoreStock() {
    // returns all the cards from the waste back into the stock
    var zIndex = 0;
    var cardsLeft = true;
    var totalCards = 0;
    while (cardsLeft == true) {
        var elem = document.elementFromPoint(88, 20); //
        if (elem.id == 'waste') {
            cardsLeft == false;
            break;
        } else {
            totalCards += 1;
            zIndex += 1;
            var thisId = parseInt(elem.id.replace('card-', ''));
            deck[thisId].posX = 10;
            deck[thisId].posY = 10;
            deck[thisId].zIndex = zIndex;
            deck[thisId].location = 'stock';
            deck[thisId].face = 'down';
            $('#card-'+thisId)
                .css('left', deck[thisId].posX)
                .css('top', deck[thisId].posY)
                .css('zIndex', zIndex)
                .css('backgroundImage', 'url(img/tile.png)')
				.html('')
				.click(turnStock); // don't forget to reattach the event handler to turn from the stock onto the waste
        }
    }
    if (totalCards == 0) { // nothing left in the waste
        notify('There are no cards left to restore from the waste.');
    } else {
        notify('You restored the cards from the waste to the stock.');
    }
}

function displayVal(val) {
	// displays a card value in full language
	
	var kv = {'A': 'Ace', 'J': 'Jack', 'Q': 'Queen', 'K': 'King'};
	if (kv.hasOwnProperty(val)) {
		return kv[val];
	} else {
		return val;
	}
}

function printObject(dict) {
	// renders an object's keys and values in a string
	// useful for printing an object to console.log
	output = [];
	for (k in dict) {
		if (dict.hasOwnProperty(k)) {
			output.push(k + '=' + dict[k]);
		}
	}
	return output.join(', ');
}

function log(message) {
	if (debugMode == false) {
		return;
	}
	console.log(message);
}

function displaySuit(suit) {
	// displays a card suit in full language
	
	var kv = {'hearts': 'Hearts', 'diams': 'Diamonds', 'clubs': 'Clubs', 'spades': 'Spades' };
	if (kv.hasOwnProperty(suit)) {
		return kv[suit];
	} else {
		return suit;
	}
}

function pcase(string) {
    // returns a string in proper case (first letter capitalized)
    return string.charAt(0).toUpperCase() + string.slice(1);
}
