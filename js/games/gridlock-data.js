export const GRIDLOCK_DATA = {
  nba: {
    name: "NBA Basketball",
    cols: [
      { id: "lal", label: "LA Lakers" },
      { id: "bos", label: "Boston Celtics" },
      { id: "gsw", label: "Golden State Warriors" }
    ],
    rows: [
      { id: "mvp", label: "Won NBA MVP" },
      { id: "jersey23", label: "Wore #23 or #33" },
      { id: "lebron", label: "Teammate of LeBron James" }
    ],
    solutions: {
      "mvp_lal": ["LeBron James", "Kobe Bryant", "Shaquille O'Neal", "Magic Johnson", "Kareem Abdul-Jabbar", "Wilt Chamberlain", "Steve Nash", "Karl Malone", "Bob McAdoo"],
      "mvp_bos": ["Larry Bird", "Bill Russell", "Bob Cousy", "Dave Cowens", "Kevin Garnett", "Shaquille O'Neal"],
      "mvp_gsw": ["Steph Curry", "Kevin Durant", "Wilt Chamberlain"],
      "jersey23_lal": ["LeBron James", "Kareem Abdul-Jabbar", "Lou Williams", "Cedric Ceballos", "Magic Johnson", "Shaquille O'Neal", "Anthony Davis"],
      "jersey23_bos": ["Larry Bird", "Robert Parish", "Jason Terry", "Kyrie Irving"],
      "jersey23_gsw": ["Draymond Green", "Mitch Richmond", "Jason Richardson"],
      "lebron_lal": ["Anthony Davis", "D'Angelo Russell", "Russell Westbrook", "Austin Reaves", "Rui Hachimura", "Dwight Howard", "Rajon Rondo", "Carmelo Anthony", "Malik Monk", "Avery Bradley", "Shaquille O'Neal", "Danny Green", "Kentavious Caldwell-Pope", "Alex Caruso", "Kyle Kuzma", "Brandon Ingram", "Lonzo Ball", "Josh Hart"],
      "lebron_bos": ["Kyrie Irving", "Shaquille O'Neal", "Rajon Rondo", "Tristan Thompson", "Jeff Green", "Avery Bradley"],
      "lebron_gsw": ["D'Angelo Russell", "JaVale McGee", "DeMarcus Cousins", "Anderson Varejao", "Richard Jefferson", "Matt Barnes"]
    },
    allPlayers: [
      "LeBron James", "Kobe Bryant", "Shaquille O'Neal", "Magic Johnson", "Kareem Abdul-Jabbar", "Wilt Chamberlain", "Steve Nash", "Karl Malone", 
      "Bob McAdoo", "Larry Bird", "Bill Russell", "Bob Cousy", "Dave Cowens", "Kevin Garnett", "Steph Curry", "Kevin Durant", "Anthony Davis", 
      "D'Angelo Russell", "Russell Westbrook", "Austin Reaves", "Rui Hachimura", "Dwight Howard", "Rajon Rondo", "Carmelo Anthony", "Malik Monk", 
      "Avery Bradley", "Danny Green", "Kentavious Caldwell-Pope", "Alex Caruso", "Kyle Kuzma", "Brandon Ingram", "Lonzo Ball", "Josh Hart", 
      "Kyrie Irving", "Tristan Thompson", "Jeff Green", "JaVale McGee", "DeMarcus Cousins", "Anderson Varejao", "Richard Jefferson", "Matt Barnes",
      "Draymond Green", "Jason Terry", "Robert Parish", "Mitch Richmond", "Jason Richardson", "Wintrust Arena", "Jaylen Brown", "Jayson Tatum",
      "Derrick White", "Al Horford", "Sam Hauser", "Klay Thompson", "Giannis Antetokounmpo", "Joel Embiid", "Nikola Jokic", "Bam Adebayo", 
      "Domantas Sabonis", "Rudy Gobert", "Myles Turner", "Naz Reid", "Dereck Lively II"
    ]
  },
  nfl: {
    name: "NFL Football",
    cols: [
      { id: "kc", label: "Kansas City Chiefs" },
      { id: "sf", label: "San Francisco 49ers" },
      { id: "ne", label: "New England Patriots" }
    ],
    rows: [
      { id: "sbmvp", label: "Super Bowl MVP" },
      { id: "jersey12", label: "Wore #12 or #87" },
      { id: "raiders", label: "Played for Raiders (LV)" }
    ],
    solutions: {
      "sbmvp_kc": ["Patrick Mahomes", "Len Dawson"],
      "sbmvp_sf": ["Joe Montana", "Steve Young", "Jerry Rice"],
      "sbmvp_ne": ["Tom Brady", "Deion Branch", "Julian Edelman"],
      "jersey12_kc": ["Travis Kelce", "Rich Gannon"],
      "jersey12_sf": ["John Brodie", "Trent Dilfer"],
      "jersey12_ne": ["Tom Brady", "Rob Gronkowski", "Jacoby Brissett"],
      "raiders_kc": ["Marcus Allen", "Rich Gannon", "Rodney Hudson", "Albert Lewis"],
      "raiders_sf": ["Jerry Rice", "Randy Moss", "Jimmy Garoppolo", "Rod Woodson", "Michael Crabtree", "Carlos Hyde", "Brian Hoyer"],
      "raiders_ne": ["Randy Moss", "Jimmy Garoppolo", "Jakobi Meyers", "Richard Seymour", "Danny Amendola", "Brandon Bolden", "Trent Brown", "LeGarrette Blount", "Cordarrelle Patterson"]
    },
    allPlayers: [
      "Patrick Mahomes", "Len Dawson", "Joe Montana", "Steve Young", "Jerry Rice", "Tom Brady", "Deion Branch", "Julian Edelman", "Travis Kelce",
      "Rich Gannon", "John Brodie", "Trent Dilfer", "Rob Gronkowski", "Jacoby Brissett", "Marcus Allen", "Rodney Hudson", "Albert Lewis", 
      "Randy Moss", "Jimmy Garoppolo", "Rod Woodson", "Michael Crabtree", "Carlos Hyde", "Brian Hoyer", "Jakobi Meyers", "Richard Seymour", 
      "Danny Amendola", "Brandon Bolden", "Trent Brown", "LeGarrette Blount", "Cordarrelle Patterson", "Lamar Jackson", "Josh Allen", 
      "Joe Burrow", "Brock Purdy", "Dak Prescott", "C.J. Stroud", "Jordan Love", "Baker Mayfield", "Sam Darnold", "Justin Fields",
      "Christian McCaffrey", "Saquon Barkley", "Breece Hall", "Jahmyr Gibbs", "Kyren Williams", "Derrick Henry", "Isiah Pacheco", 
      "Justin Jefferson", "Tyreek Hill", "CeeDee Lamb", "Ja'Marr Chase", "Amon-Ra St. Brown", "Puka Nacua", "Nico Collins", "Zay Flowers", 
      "Travis Kelce", "George Kittle", "Sam LaPorta", "Trey McBride", "Mark Andrews", "Trent Williams", "Penei Sewell", "Zack Martin"
    ]
  },
  nhl: {
    name: "NHL Hockey",
    cols: [
      { id: "pit", label: "Pittsburgh Penguins" },
      { id: "edm", label: "Edmonton Oilers" },
      { id: "nyr", label: "New York Rangers" }
    ],
    rows: [
      { id: "hart", label: "Won Hart Trophy (MVP)" },
      { id: "jersey87", label: "Wore #87, #99, or #68" },
      { id: "bruins", label: "Played for Boston Bruins" }
    ],
    solutions: {
      "hart_pit": ["Sidney Crosby", "Evgeni Malkin", "Mario Lemieux", "Jaromir Jagr"],
      "hart_edm": ["Connor McDavid", "Wayne Gretzky", "Leon Draisaitl", "Mark Messier"],
      "hart_nyr": ["Igor Shesterkin", "Wayne Gretzky", "Mark Messier", "Artemi Panarin"],
      "jersey87_pit": ["Sidney Crosby", "Jaromir Jagr"],
      "jersey87_edm": ["Wayne Gretzky"],
      "jersey87_nyr": ["Wayne Gretzky", "Jaromir Jagr", "Donald Brashear"],
      "bruins_pit": ["Zdeno Chara", "Jarome Iginla", "Mark Recchi", "Phil Kessel", "Blake Wheeler", "Danton Heinen", "Hal Gill"],
      "bruins_edm": ["Zdeno Chara", "Milan Lucic", "Andrew Ference", "Nathan Horton", "Blake Wheeler", "Taylor Hall"],
      "bruins_nyr": ["Zdeno Chara", "Brian Gionta", "Rick Nash", "Brian Leetch", "Phil Kessel", "Nick Holden", "Brad Park"]
    },
    allPlayers: [
      "Sidney Crosby", "Evgeni Malkin", "Mario Lemieux", "Jaromir Jagr", "Connor McDavid", "Wayne Gretzky", "Leon Draisaitl", "Mark Messier",
      "Igor Shesterkin", "Artemi Panarin", "Donald Brashear", "Zdeno Chara", "Jarome Iginla", "Mark Recchi", "Phil Kessel", "Blake Wheeler",
      "Danton Heinen", "Hal Gill", "Milan Lucic", "Andrew Ference", "Nathan Horton", "Taylor Hall", "Brian Gionta", "Rick Nash", "Brian Leetch",
      "Nick Holden", "Brad Park", "Nathan MacKinnon", "Auston Matthews", "Aleksander Barkov", "Jack Hughes", "Sebastian Aho", "Robert Thomas",
      "Wyatt Johnston", "Connor Bedard", "Charlie Coyle", "Morgan Geekie", "Matthew Tkachuk", "Kirill Kaprizov", "Filip Forsberg",
      "Kyle Connor", "Brady Tkachuk", "Carter Verhaeghe", "Alexis Lafreniere", "Mason McTavish", "Bobby McMann", "Nikita Kucherov",
      "David Pastrnak", "Mikko Rantanen", "Sam Reinhart", "William Nylander", "Mitch Marner", "Zach Hyman", "Travis Konecny", "Seth Jarvis",
      "Quinn Hughes", "Roman Josi", "Victor Hedman", "Miro Heiskanen", "Josh Morrissey", "Devon Toews", "Gustav Forsling", "Hampus Lindholm",
      "Cale Makar", "Adam Fox", "Charlie McAvoy", "Evan Bouchard", "Noah Dobson", "Alex Pietrangelo", "Brock Faber", "Brandon Montour",
      "Connor Hellebuyck", "Sergei Bobrovsky", "Thatcher Demko", "Juuse Saros", "Jeremy Swayman", "Stuart Skinner", "Ukko-Pekka Luukkonen",
      "Pyotr Kochetkov", "Joey Daccord", "Samuel Ersson", "Joseph Woll"
    ]
  }
};
