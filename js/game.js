// global variables
var Sol = {
    __description__: 'I hacked up a solitaire game in HTML, CSS and JavaScript with jQuery and (almost) no images.\n \nFor now it follows the simplest Klondike rules: turn one card at a time, with no limit on passes through the deck.',
    __version__: 0.20,
    __author__: 'Ryan McGreal',
    __releasedate__: '2011-10-04',
    __homepage__: 'http://quandyfactory.com/projects/74/solitaire',
    __copyright__: '(C) 2011 by Ryan McGreal',
    __licence__: 'GNU General Public Licence, Version 2',
    __licence_url__: 'http://www.gnu.org/licenses/old-licenses/gpl-2.0.html',

    margin: 10, // normal space between objects on the board
    padding: 2, // normal padding inside an object
    suits: 'hearts diams clubs spades'.split(' '),
    vals: 'A 2 3 4 5 6 7 8 9 10 J Q K'.split(' '),
    zIndex: 51, // initialize zIndex so we can always put cards on top of each other
    score: 0, // increment by 1 each time you put a card on the foundation, decrement by 1 when you remove a card
    moves: 0, // number of moves in current game
    debugMode: false, // set to true to send details to console.log
    deck: [],
    history: []
};

Sol['width'] = 54 + (Sol.padding * 2) + Sol.margin; // width of a card bed + margin
Sol['height'] = 84 + (Sol.padding * 2) + Sol.margin; // height of a card bed + margin

for (val in Sol) {
    if (Sol.hasOwnProperty(val)) {
        log('Sol.'+val+'='+Sol[val]);
    }
}

// create and shuffle a new deck
Sol.deck = makeDeck(); 
Sol.deck = shuffle(Sol.deck); 

$(document).ready(function(){
     $('#board').noisy({
        intensity: 0.9,
        size: 200,
        opacity: 0.1,
        monochrome: false
    });
    Sol.deck = startGame(Sol.deck);
    
    Sol.deck = playGame(Sol.deck);
    
});

function startGame(deck) {
    // sets up a game and starts it
    
    // clear the board
    $('#board').html('');
    
    addTools();
    addScore();
    addMoves();
    
    // add foundations
    addFoundation();
    addPlayingArea();
    addStockWaste();
    
    // load the cards into the stock
    deck = loadCards(deck);
    
    // deal the cards onto the playing area
    deck = deal(deck);

    return deck;
}

function addTools() {
    // adds restart and redeal buttons
    $('#board').append($('<div id="tools"></div>'));
    $('#tools').append($('<button id="undo" title="Undo the last move">&lArr; Undo</button>'));
    $('#tools').append($('<button id="restart" title="Start this game over again">Restart</button>'));
    $('#tools').append($('<button id="redeal" title="Shuffle the deck and start a new game">New Game</button>'));
    $('#tools').append($('<button id="rules" title="Instructions on how to play the game">Rules</button>'));
    $('#tools').append($('<button id="about" title="About this game">About</button>'));
    $('#undo').click(undo);
    $('#restart').click(restart); 
    $('#redeal').click(redeal); 
    $('#about').click(about);
    $('#rules').click(rules);
}


function deepCopy(obj) {
    // javascript has no easy way to do a deep copy of an object
    // function source: http://snipplr.com/view/15407/deep-copy-an-array-or-object/
    if (Object.prototype.toString.call(obj) === '[object Array]') {
        var out = [], i = 0, len = obj.length;
        for ( ; i < len; i++ ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    if (typeof obj === 'object') {
        var out = {}, i;
        for ( i in obj ) {
            out[i] = arguments.callee(obj[i]);
        }
        return out;
    }
    return obj;
}


function addHistory(deck) {
    // adds a snapshot of the deck to the Sol.history array
    var myCopy = deepCopy(deck);
    Sol.history.push(myCopy);
    log('pushed deck to history: ');
    log(deck);
}

function undo() {
    // pulls the previous deck state out of Sol.history and resets the cards to that state
    
    // 0. Check length of history
    if (Sol.history.length == 1) {
        notify('You are at the first move.');
        return;
    }

    log('Deck: ');
    log(Sol.deck);

    // 1. Pop the current deck out of history
    Sol.history.pop();

    // 2. Make the deck equal to the previous history
    Sol.deck = Sol.history[Sol.history.length-1];
    
    // 3. Reposition the cards in their previous locations
    for (var c=0; c<Sol.deck.length; c++) {
        var card = Sol.deck[c];
        log(printObject(card));
        $('#'+card.id)
            .css('left', card.posX)
            .css('top', card.posY)
            .css('zIndex', card.zIndex)
            .css('color', card.colour);
        if (card.face == 'up') {
            $('#'+card.id)
                .css('background', 'white')
                .html(card.val + '&' + card.suit + ';');
        } else {
            $('#'+card.id)
                .html('')
                .css('background', '')
                .css('background-image', 'url(img/tile.png');
        }
    }
    
    // 4. Cycle through the deck, remove all existing event handlers and re-add them
    for (i=0; i < Sol.deck.length; i++ ) {
        // $('#'+Sol.deck[i].id).unbind(); // remove any existing handler
        log('Attaching handlers to card ' + i + '; id ' + Sol.deck[i].id);
        attachHandlers(i); // attach proper handler for its position and face
    }
    
    
    // 5. Update Score
    var foundationCards = 0; // initialize
    for (i=0; i < Sol.deck.length; i++) {
        if (Sol.deck[i].location == 'foundation') {
            foundationCards += 1;
        }
    }
    Sol.score = foundationCards;
    updateScore(Sol.score);
    
    // 6. Decrement number of moves
    Sol.moves -= 1;
    updateMoves(Sol.moves);
    
    log('Sol.deck: ');
    log(Sol.deck);
    notify('You undid your last move.');
}

function rules() {
    // adds an overlay with instructions on how to play the game
    $('#about_pane').remove(); // just in case
    $('#rules_pane').remove(); // just in case
    var output = [];
    output.push('<div id="rules_pane" title="Click on this pane to close it.">');
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
    $('#rules_pane')
        .mouseenter(function() {
            $('#rules_pane').css('cursor', 'pointer');
        })
        .click(function() {
        $('#rules_pane').remove();
    });
}    
    
function about() {
    // adds an overlay explaining about the game
    $('#about_pane').remove(); // just in case
    $('#rules_pane').remove(); // just in case
    var output = [];
    output.push('<div id="about_pane" title="Click on this pane to close it.">');
    output.push('<h2>About this Game</h2>');
    output.push('<p>' + Sol.__description__.replace('\n', '<br>') + '</p>');
    output.push('<ul>');
    output.push('<li>Author: ' + Sol.__author__ + '</li>');
    output.push('<li>Copyright: ' + Sol.__copyright__ + '</li>');
    output.push('<li><a target="_blank" href="' + Sol.__licence_url__ + '">' + Sol.__licence__ + '</a></li>');
    output.push('<li>Version: ' + Sol.__version__ + ', released ' + Sol.__releasedate__ + '</li>');
    output.push('<li>Homepage: <a target="_blank" href="' + Sol.__homepage__ + '">' + Sol.__homepage__ + '</a></li>');
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
    Sol.score = 0; // reset score
    $('#board').append($('<div id="score">Score: ' + Sol.score + '</div>'));
}

function updateScore(newval) {
    // updates the score notification
    $('#score').html('Score: ' + newval);
    if (newval == 52) {
        var answer = confirm('You won the game! Click OK to deal a new hand.');
    }
    if (answer) {
        redeal();
    }
    log('score=' + newval);
}

function addMoves() {
    // adds a number of moves to the board
    Sol.moves = 0; // reset moves
    $('#board').append($('<div id="moves">Moves: ' + Sol.moves + '</div>'));
}

function updateMoves(newval) {
    // updates the moves notification
    $('#moves').html('Moves: ' + newval);
    log('moves=' + newval);
}

function redeal() {
    // reshuffles the deck and deals a new hand
    Sol.deck = makeDeck();
    Sol.deck = shuffle(Sol.deck);
    Sol.deck = startGame(Sol.deck);
    Sol.moves = 0;
    Sol.score = 0;
    playGame(Sol.deck);
    notify('You started a new game.');
}

function restart() {
    // redeals the currently shuffled deck
    Sol.history = []; // reset history
    Sol.deck = startGame(Sol.deck); // deal the cards
    Sol.moves = 0;
    SOl.score = 0;
    playGame(Sol.deck);
    notify('You restarted this game.');
}

function addFoundation() {
    // adds the foundation beds, where the cards end up sorted by suit and ascending from Ace
    for (var i = 0; i < 4; i++ ) {
        var distFromLeft = 204;
        var thisWidth = distFromLeft + (Sol.width*i) + Sol.margin;
        $('#board').append($('<div class="bed" title="Foundation" id="foundation_' + i + '" style="top: ' + Sol.margin + 'px; left: ' + thisWidth + 'px;"></div>'));
        var thisPos = $('#foundation_' + i).position();
        log('in addFoundation(); foundation_' + i + ' - ' + thisPos.left + ', ' + thisPos.top);
    }
}

function addPlayingArea() {
    // add the playing area beds, where the cards are dealt
    for (var i=0; i<7; i++ ) {
        var thisWidth = (Sol.width*i) + Sol.margin;
        var thisheight = Sol.height + Sol.margin;
        $('#board').append($('<div class="bed" title="Playing Area" id="play_' + i + '" style="top: ' + thisheight + 'px; left: ' + thisWidth + 'px;"></div>'));
    }
}

function addStockWaste() {
    // add the stock and waste beds
    for (var i=0; i<2; i++ ) {
        var thisWidth = (Sol.width*i) + Sol.margin;
        if (i == 0) {
            var thisId = 'stock';
        } else {
            var thisId = 'waste';
        }
        $('#board').append($('<div class="bed" title="' + pcase(thisId) + '" id="' + thisId + '" style="top: ' + Sol.margin + 'px; left: ' + thisWidth + 'px;"></div>'));
    }
}

function makeDeck() {
    // creates and returns a deck of cards
    var deck = [];
    var id = 0;
    for (var s=0; s < Sol.suits.length; s++ ) {
        for (var v=0; v < Sol.vals.length; v++ ) {
            var colour = 'red';
            if ((Sol.suits[s] === 'clubs') || (Sol.suits[s] === 'spades')) {
                colour = 'black';
            }
            deck.push({ 
                'suit': Sol.suits[s], 
                'suitNum': s,
                'val': Sol.vals[v], 
                'valNum': v + 1, // for comparing values on a drop
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
        id +=1;
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
    for (var i = 0; i < deck.length; i++ ) {
        deck[i].id = 'card-' + i;
        deck[i].idNum = i;
    }
    return deck;
}

function loadCards(deck) {
    // loads the cards onto the stock before dealing
    for (var i = 0; i < deck.length; i++ ) {
        $('#board').append(
            $('<div class="card" style="top: ' + Sol.margin + 'px; left: ' + Sol.margin + 'px;"></div>')
            .css('color', deck[i].colour)
            .css('zIndex', i)
            .attr('id', 'card-' + i)
            .css('position', 'absolute')
        );
        $('#card-' + i).unbind(); // remove any event handlers from before
        log('in loadCards(); unbinding events from card-' + i);
        deck[i].posX = Sol.margin;
        deck[i].posY = Sol.margin;
        deck[i].location = 'stock';
        deck[i].face = 'down';
        deck[i].zIndex = i;
        deck[i].parentId = -1;
        deck[i].childId = -1;
        log('in loadCards(); card-' + i +  '; ' +  printObject(Sol.deck[i]));
    }
    return deck
}

function deal(deck) {
    // deals a deck onto the playing area
    log(' ');
    log('Dealing the deck...');
    log(' ');
    var cardIndex = 51; // start counting down
    for (var mainLoop=7; mainLoop>0; mainLoop--) {
        var thisTop = Sol.height + Sol.margin * (7 - mainLoop + 1);
        var thisLeft = Sol.width * (7 - mainLoop) + Sol.margin;
        Sol.zIndex +=1;
        $('#card-' + cardIndex)
            .css('background', 'white')
            .css('top', thisTop + 'px')
            .css('left', thisLeft + 'px')
            .css('z-index', Sol.zIndex)
            .html(deck[cardIndex].val + '&' + deck[cardIndex].suit + ';');
        deck[cardIndex].zIndex = Sol.zIndex;
        deck[cardIndex].posX = thisLeft;
        deck[cardIndex].posY = thisTop;
        deck[cardIndex].location = 'play';
        log('in deal(); card-' + cardIndex + ', ' + printObject(deck[cardIndex]));
        deck[cardIndex].face = 'up';
        cardIndex -= 1;
        for (var i = cardIndex; i > cardIndex - mainLoop + 1; i--) {
            Sol.zIndex +=1;
            var thisLeft = (Sol.width*(cardIndex - i + 7 - mainLoop + 1)) + Sol.margin;
            $('#card-' + i).css('top', thisTop + 'px').css('left', thisLeft + 'px').css('z-index', Sol.zIndex);
            deck[i].zIndex = Sol.zIndex;
            deck[i].posX = thisLeft;
            deck[i].posY = thisTop;
            deck[i].location = 'play';
            log('(in deal(); card-' + i + ', ' + printObject(Sol.deck[i]));
        }
        cardIndex -= mainLoop-1;
    }
    addHistory(deck); // add this snapshot to history
    return deck;    
}

function playGame(deck) {
    // main function to enable game play
    for (i=0; i < deck.length; i++ ) {
        attachHandlers(i);
    }
    // click on the empty stock and restore the cards from the waste
    $('#stock')
        .mouseenter(function() {
            $(this).css('cursor', 'pointer');
        })
        .click(restoreStock);
    return deck;
}

function attachHandlers(i) {
    // attches event handlers to cards by index
    // primary use is inside the main loop in playGame(); but also used in undo()
    
    // handle cards that are facing up
    if (Sol.deck[i].face == 'up') { 
        log('in playGame(); Card is face-up:' +  i + '; ' +  printObject(Sol.deck[i]));
        makeDraggable('card-' + i); // add the draggable event handler

    // handle cards that are facing down
    } else { 
        log('in playGame(); Card is face-down: id =' +  i +  ', ' + printObject(Sol.deck[i]));
        // add click handlers to the cards in the stock
        if (Sol.deck[i].location == 'stock') { // click on a card in the stock to move it to the waste
            log('in playGame(); Card in stock: id =' +  i +  ', ' +  printObject(Sol.deck[i]));
            var thisId = i;
            $('#card-' + i)
                .mouseenter(function() {
                    $(this)
                        .css('cursor', 'pointer')
                        .attr('title', 'Click on this card to turn it over');
                })
                .click(turnStock);
                
        } else if (Sol.deck[i].location == 'play') { // turned-down card in play
            var thisId = i;
            $('#card-' + i)
                .mouseenter(function() {
                    $(this)
                        .css('cursor', 'pointer')
                        .attr('title', 'Click on this card to flip it');
                })
                .click(flipCard);
        }
    }
}

function makeDraggable(id) {
    // implements the functionality to make a card draggable
    $('#' + id)
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
    log('Just added draggable to card id ' + id);
}

function makeDblClick(id) {
    // adds an event handler to double-click and auto-move into the foundation if applicable
    
    // first, remove a double-click handler if there is one so we don't get multiple event handlers firing
    $('#' + id).unbind('dblclick');
    $('#' + id).unbind('click'); // also unbind click events - the card is already flipped over
    
    // now add the handler
    $('#' + id)
        .dblclick(function() {
            thisIdNum = parseInt(this.id.replace('card-',''));
            console.log('dblclick fired on ' + id);
            var thisTop = 20;
            var thisLeft = [224, 292, 360, 428];
            for (i=0;i<thisLeft.length;i++ ) {
                var elem = document.elementFromPoint(thisLeft[i], thisTop);
                log('foundation id: ' + elem.id + ', substring: ' + elem.id.substring(0,10));
                if (elem.id.substring(0,10) == 'foundation' && Sol.deck[thisIdNum].val == 'A') {
                    log('in makeDblClick(); the ' + Sol.deck[thisIdNum].val + ' of ' + Sol.deck[thisIdNum].suit + ' moves to ' + elem.id + '.');
                    moveFoundation('ace', this.id, elem.id);
                    Sol.moves +=1;
                    updateMoves(Sol.moves);
                    break;
                } else { // there's a card on the foundation
                    var thisElemNum = parseInt(elem.id.replace('card-',''));
                    log('thisIdNum=' + thisIdNum + ', thisElemNum=' + thisElemNum);
                    if (thisElemNum && Sol.deck[thisIdNum].suit == Sol.deck[thisElemNum].suit && Sol.deck[thisIdNum].valNum == Sol.deck[thisElemNum].valNum + 1) {
                        log('in makeDblClick(); the ' + Sol.deck[thisIdNum].val + ' of ' + Sol.deck[thisIdNum].suit + ' moves to ' + elem.id + '.');
                        moveFoundation('', this.id, elem.id);
                        Sol.moves +=1;
                        updateMoves(Sol.moves);
                        break;
                }
            }
        }
    });
}

function dragStop() {
    // controls what happens when you stop dragging a card
    // TODO: big hairy function should be broken up into discrete functions
    
    Sol.moves += 1;
    updateMoves(Sol.moves);
    
    var this_id = this.id;
    var this_card = Sol.deck[parseInt(this_id.replace('card-', ''))];
    log('in dragStop(); Card moved: ' +  printObject(this_card));
    
    // look to see if there is a card under the drop spot
    var pos = $('#' + this_id).position();
    $('#' + this_id).css('display', 'none'); // hide card to search beneath it
    var elem = document.elementFromPoint(pos.left + 20, pos.top + 20);
    var elem_id = elem.id;
    var elem_class = $('#' + elem_id).attr('class');
    log(elem_id.substring(0,5));
    
    // trying to place a card on another card
    if (elem_id.substring(0,5) == 'card-') { 
        var under_card = Sol.deck[parseInt(elem_id.replace('card-',''))];
        log('in dragStop(); under_card: ' +  printObject(under_card));
        
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
                && this_card.location != 'foundation' // no double-points for cards already in foundation
            ) {
            moveFoundation('', this_card.id, under_card.id);
        // nudging a card that is already on a card on the foundation
        } else if ( 
                under_card.face == 'up' // card under must be face up
                && under_card.location == 'foundation' // card is in foundation
                && this_card.suit == under_card.suit // same suit
                && this_card.valNum == under_card.valNum + 1 // card must be one more than card under
                && this_card.location == 'foundation' // no double-points for cards already in foundation
            ) {
            $(this).css('top', this_card.posY).css('left', this_card.posX);
            notify('The ' + displayVal(this_card.val) + ' of ' + displaySuit(this_card.suit) + ' is on the ' + displayVal(under_card.val) + ' of ' + displaySuit(under_card.suit) + '.');
            Sol.moves -= 1;
            updateMoves(Sol.moves);
        // card isn't turned up
        } else if (under_card.face == 'down') { 
            $(this).css('top', this_card.posY).css('left', this_card.posX);
            notify('You cannot place your card on a card that has not been turned up yet.');
            Sol.moves -= 1;
            updateMoves(Sol.moves);
        } else {
            $(this).css('top', this_card.posY).css('left', this_card.posX);
            notify('You cannot place the ' + displayVal(this_card.val) + ' of ' + displaySuit(this_card.suit) + ' on the ' + displayVal(under_card.val) + ' of ' + displaySuit(under_card.suit) + '.');
            Sol.moves -= 1;
            updateMoves(Sol.moves);
        }
    // trying to place a card on a bed
    } else if (elem_class == 'bed') { 
        log('elem_id=' +  elem_id +  ', elem_class =' +  $('#' + elem_id).attr('class'));
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
            Sol.moves -= 1;
            updateMoves(Sol.moves);
        // trying to put a king on a play bed
        } else if ( 
                elem_id.substring(0,5) == 'play_' // the bed has to be a play bed
                && this_card.val == 'K' // the card needs to be a king
            ) {
            this_card.posX = parseInt($('#' + elem_id).css('left').replace('px', ''));
            this_card.posY = parseInt($('#' + elem_id).css('top').replace('px', ''));
            if (this_card.location == 'foundation') { // don't forget to decrement score if moving a king off the foundation
                Sol.score -= 1;
                updateScore(Sol.score);
            }
            this_card.location = 'play';
            log(printObject(this_card));
            $(this).css('left', this_card.posX).css('top', this_card.posY);
            notify('You placed the ' + displayVal(this_card.val) + ' of ' + displaySuit(this_card.suit) + ' into an empty playing area.');
            addHistory(Sol.deck);
            // need to check whether any cards are on the king, i.e. another card has the king's id as a parentId
            for (var check=0; check<Sol.deck.length; check++ ) {
                if (Sol.deck[check].parentId == this_card.id) {
                    putCardOnCard(Sol.deck[check].id, this_card.id); // recursive so it will capture any other cards below
                    break;
                }
            }
        // trying to put something other than a king on a play bed
        } else if ( 
                elem_id.substring(0,5) == 'play_' // the bed is a play bed
            ) {
            $(this).css('top', this_card.posY).css('left', this_card.posX);                            
            notify('You cannot place the ' + displayVal(this_card.val) + ' of ' + displaySuit(this_card.suit) + ' directly on the playing area.');
            Sol.moves -= 1;
            updateMoves(Sol.moves);
        }
    // trying to place a card somewhere else on the board
    } else { 
        log('elem_id =' +  elem_id +  ', elem_class=' +  $('#' + elem_id).attr('class'));
        $(this).css('top', this_card.posY).css('left', this_card.posX);
        notify('You cannot place a card elsewhere on the board.');
        Sol.moves -= 1;
        updateMoves(Sol.moves);
    }
    log('in dragStop(); elem_id=' + elem_id + ', pos.left=' +  pos.left + ', pos.top=' +  pos.top);
    $('#' + this_id).css('display', 'block'); // restore visibility after hiding
}

function findCardFromId(id) {
    // returns an object from the deck with a given id
    for (var i=0; i<Sol.deck.length; i++ ) {
        if (Sol.deck[i].id == id) {
            return i;
        }
    }
    return false;
}

function moveFoundation(which, card_id, elem_id) {
    // moves a card from the playing area to the foundation
    
    if (which == 'ace') {
        var deckId = parseInt(card_id.replace('card-', ''));
        var this_card = Sol.deck[deckId];
        this_card.posX = $('#' + elem_id).css('left');
        this_card.posY = $('#' + elem_id).css('top');
        log('in moveFoundation(); deckId=' + deckId + ', card_id=' + card_id + ', elem_id=' + elem_id + ', deckId=' +  deckId + ', this_card.posX=' + this_card.posX + ', this_card.posY=' +  this_card.posY);
        // increment score only if ace wasn't already moved to the foundation
        if (this_card.location != 'foundation') {
            Sol.score +=1;
        }
        this_card.location = 'foundation';
        this_card.parentId = -1;
        $('#' + card_id)
            .css('left', this_card.posX)
            .css('top', this_card.posY)
            .unbind('dblclick');
        
        log('score=' + Sol.score);
        updateScore(Sol.score);
        notify('You placed the ' + displayVal(this_card.val) + ' of ' + displaySuit(this_card.suit) + ' into the foundation.');
        addHistory(Sol.deck);
        return;
        
    } else {
        var cardIdNum = parseInt(card_id.replace('card-', ''));
        var underIdNum = parseInt(elem_id.replace('card-', ''));
        var this_card = Sol.deck[cardIdNum];
        var under_card = Sol.deck[underIdNum];
        this_card.posX = under_card.posX;
        this_card.posY = under_card.posY;
        this_card.location = 'foundation';
        $('#' + this_card.id)
            .css('left', this_card.posX)
            .css('top', this_card.posY)
            .css('zIndex', under_card.zIndex + 1)
            .unbind('dblclick');
        this_card.zIndex = under_card.zIndex + 1;
        $('#' + this_card.id).css('zIndez', this_card.zIndex);
        this_card.parentId = under_card.id;
        this_card.parentId = -1;
        for (var check=0; check< Sol.deck.length; check++ ) {
            if (Sol.deck[check].childId == this_card.id) {
                Sol.deck[check].childId = -1; // detach parent cards
                break;
            }
        }
        Sol.score +=1;
        log('score=' + Sol.score);
        updateScore(Sol.score);
        notify('You placed the ' + displayVal(this_card.val) + ' of ' + displaySuit(this_card.suit) + ' into the foundation.');
        addHistory(Sol.deck);
    }
}

function putCardOnCard(this_card_id, under_card_id) {
    // place a card on another card in the playing area
    // NOT for use placing a card on a card in the foundation
    log('in putCardOnCard(); this_card_id=' +  this_card_id + ', under_card_id=' +  under_card_id);
    // puts a card on another card in the playing area
    var this_card = Sol.deck[findCardFromId(this_card_id)];
    var under_card = Sol.deck[findCardFromId(under_card_id)];
    log('in putCardOnCard(); top card BEFORE: ' +  this_card_id + ', ' +  findCardFromId(this_card_id) + ', ' +  printObject(this_card));
    log('in putCardOnCard(); under card BEFORE: ' +  under_card_id + ', ' +  findCardFromId(under_card_id) + ', ' +  printObject(under_card));
    this_card.posX = under_card.posX;
    this_card.posY = under_card.posY + 20;
    this_card.zIndex = under_card.zIndex + 1;
    if (this_card.location == 'foundation') {
        Sol.score -= 1; // decrement score when taking a card out of the foundation
        updateScore(Sol.score); // update the displayed score
    }
    this_card.location = 'play'; // for cards moved from the waste or the foundation
    $('#' + this_card_id)
        .css('left', this_card.posX)
        .css('top', this_card.posY)
        .css('zIndex', this_card.zIndex);
    log('in putCardOnCard(); <div id="' + this_card_id + '">: left=' +  $('#' + this_card_id).css('left') +  ', top=' +  $('#' + this_card_id).css('top') +  ', zIndex=' +  $('#card-' + this_card_id).css('zIndex'));
    this_card.parentId = under_card.id;
    under_card.childId = this_card.id;
    notify('You placed the ' + displayVal(this_card.val) + ' of ' + displaySuit(this_card.suit) + ' on the ' + displayVal(under_card.val) + ' of ' + displaySuit(under_card.suit) + '.');
    log('in putCardOnCard(); top card AFTER: ' +  this_card_id + ', ' +  findCardFromId(this_card_id) + ', ' +  printObject(this_card));
    log('in putCardOnCard(); under card AFTER: ' +  under_card_id + ', ' +  findCardFromId(under_card_id) + ', ' +  printObject(under_card));    
    if (this_card.childId != -1) {
        // gettin' all recursive in yo biznitch
        putCardOnCard(this_card.childId, this_card.id)
    }
    addHistory(Sol.deck);
}

function turnStock() {
    // turn a card from the stock onto the waste
    
    Sol.moves += 1;
    updateMoves(Sol.moves);
    
    var thisId = parseInt(this.id.replace('card-', ''));
    // first, get the id of the waste
    var thisWaste = document.elementFromPoint(88, 20);
    var thisZindex = $('#' + thisWaste.id).css('zIndex');
    if (thisZindex == 'auto') {
        thisZindex = 1;
    } else {
        thisZindex = parseInt(thisZindex);
    }
    // now update the card properties in the deck
    Sol.deck[thisId].zIndex = thisZindex + 1;
    Sol.deck[thisId].posX = 78;
    Sol.deck[thisId].posY = 10;
    Sol.deck[thisId].face = 'up';
    Sol.deck[thisId].location = 'waste';
    // now update the div corresponding to the card
    $(this)
        .css('left', Sol.deck[thisId].posX + 'px')
        .css('top', Sol.deck[thisId].posY + 'px')
        .css('background', 'white')
        .css('zIndex', Sol.deck[thisId].zIndex)
        .html(Sol.deck[thisId].val + '&' + Sol.deck[thisId].suit + ';');
    makeDraggable(this.id);
    // don't forget to remove the click event handler from when it was on the stock
    $(this).unbind('click');
    notify('You moved the ' + displayVal(Sol.deck[thisId].val) + ' of ' + displaySuit(Sol.deck[thisId].suit) + ' from the stock to the waste.');
    addHistory(Sol.deck);
}

function flipCard() {
    // this flips over a turned-down card in the play area
    
    Sol.moves += 1;
    updateMoves(Sol.moves);
    
    var thisId = parseInt(this.id.replace('card-', ''));
    
    console.log('Click fired on ' + thisId);
    // make sure there aren't any cards on top of this card
    var elem = document.elementFromPoint(Sol.deck[thisId].posX + 10, Sol.deck[thisId].posY + 30);
    log('this.id = ' + this.id +  ', Sol.deck[thisId].posX + 10=' +  Sol.deck[thisId].posX + 10 + ', Sol.deck[thisId].posY + 30=' +  Sol.deck[thisId].posY + 30 +  ', elem.id=' +  elem.id);
    if (elem.id == this.id) {
        Sol.deck[thisId].face = 'up';
        log(Sol.deck[thisId]);
        $('#' + this.id)
            .css('background', 'white')
            .html(Sol.deck[thisId].val + '&' + Sol.deck[thisId].suit + ';');
        makeDraggable(this.id);
        notify('You flipped over the ' + displayVal(Sol.deck[thisId].val) + ' of ' + displaySuit(Sol.deck[thisId].suit) + '.');
    } else {
        notify('You cannot flip a card that is covered by another card.');
    }
    addHistory(Sol.deck);
}

function notify(message) {
    // sends a message to the notification area
    $('#notification').html(message).fadeOut('fast').fadeIn('slow');
}

function restoreStock() {
    // returns all the cards from the waste back into the stock
    Sol.zIndex = 0;
    var cardsLeft = true;
    var totalCards = 0;
    while (cardsLeft == true) {
        var elem = document.elementFromPoint(88, 20); //
        if (elem.id == 'waste') {
            cardsLeft == false;
            break;
        } else {
            totalCards +=1;
            Sol.zIndex +=1;
            var thisId = parseInt(elem.id.replace('card-', ''));
            Sol.deck[thisId].posX = 10;
            Sol.deck[thisId].posY = 10;
            Sol.deck[thisId].zIndex = Sol.zIndex;
            Sol.deck[thisId].location = 'stock';
            Sol.deck[thisId].face = 'down';
            $('#card-' + thisId)
                .css('left', Sol.deck[thisId].posX)
                .css('top', Sol.deck[thisId].posY)
                .css('zIndex', Sol.zIndex)
                .css('backgroundImage', 'url(img/tile.png)')
                .html('')
                .unbind('click') // clean up previous click event handlers
                .click(turnStock); // don't forget to reattach the event handler to turn from the stock onto the waste
        }
    }
    if (totalCards == 0) { // nothing left in the waste
        notify('There are no cards left to restore from the waste.');
    } else {
        notify('You restored the cards from the waste to the stock.');
    }
    addHistory(Sol.deck);
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
    if (Sol.debugMode == false) {
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

