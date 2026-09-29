// STEALTH RESILIENCE - Vehicles Fleet
export const VEHICLES = [
  // CARS 12
  {id:1, name:"Sedan Alpha", type:"Car", speed:180, armor:40, seats:4, price:5000, desc:"Civilian sedan, good for stealth"},
  {id:2, name:"SUV Titan", type:"Car", speed:160, armor:70, seats:6, price:8000, desc:"Offroad SUV"},
  {id:3, name:"Muscle Demon V8", type:"Car", speed:260, armor:50, seats:2, price:15000, desc:"American muscle for chases"},
  {id:4, name:"Superbike Killer GT", type:"Car", speed:340, armor:30, seats:2, price:35000, desc:"Hypercar, escape Michael"},
  {id:5, name:"Offroad Baja", type:"Car", speed:150, armor:60, seats:4, price:9000, desc:"Desert runner"},
  {id:6, name:"Armored Van ZEN", type:"Car", speed:140, armor:120, seats:6, price:12000, desc:"Bulletproof transport"},
  {id:7, name:"Police Interceptor", type:"Car", speed:220, armor:80, seats:4, price:0, desc:"Stolen police car"},
  {id:8, name:"Taxi Drift", type:"Car", speed:170, armor:35, seats:4, price:3000, desc:"Blend in city"},
  {id:9, name:"Cartel Lowrider", type:"Car", speed:200, armor:45, seats:4, price:7000, desc:"Michael's gang car"},
  {id:10, name:"Electric Stealth", type:"Car", speed:250, armor:40, seats:4, price:20000, desc:"Silent electric, no engine noise"},
  {id:11, name:"Pickup Gunner", type:"Car", speed:165, armor:75, seats:3, price:10000, desc:"With mounted M249"},
  {id:12, name:"Limo Executive", type:"Car", speed:190, armor:90, seats:8, price:18000, desc:"Michael travels in this"},

  // BIKES 6
  {id:13, name:"Street Raptor 600", type:"Bike", speed:280, armor:10, seats:2, price:6000, desc:"Fast bike for alleys"},
  {id:14, name:"Dirt Scrambler", type:"Bike", speed:180, armor:15, seats:2, price:4000, desc:"Offroad bike"},
  {id:15, name:"Superbike H2R", type:"Bike", speed:380, armor:5, seats:1, price:25000, desc:"Fastest bike, 400 km/h"},
  {id:16, name:"Chopper Cartel", type:"Bike", speed:200, armor:20, seats:2, price:8000, desc:"Harley style"},
  {id:17, name:"Electric Moto Stealth", type:"Bike", speed:220, armor:10, seats:1, price:12000, desc:"Silent infiltration"},
  {id:18, name:"ATV Quad", type:"Bike", speed:120, armor:25, seats:2, price:5000, desc:"All terrain quad"},

  // SHIPS 4
  {id:19, name:"Speedboat Phantom", type:"Ship", speed:140, armor:30, seats:4, price:15000, desc:"River escape"},
  {id:20, name:"Patrol Boat Gun", type:"Ship", speed:100, armor:100, seats:6, price:30000, desc:"With 50cal"},
  {id:21, name:"Yacht Zen Luxury", type:"Ship", speed:80, armor:60, seats:12, price:50000, desc:"Michael's party yacht"},
  {id:22, name:"Jet Ski Wave", type:"Ship", speed:180, armor:5, seats:1, price:5000, desc:"Agile water craft"},

  // PLANES 4
  {id:23, name:"Cessna Scout", type:"Plane", speed:300, armor:20, seats:4, price:25000, desc:"Prop plane recon"},
  {id:24, name:"Cargo C-130 Shadow", type:"Plane", speed:500, armor:80, seats:20, price:80000, desc:"Drop supplies"},
  {id:25, name:"Stunt Plane X", type:"Plane", speed:450, armor:15, seats:1, price:35000, desc:"Aerobatic"},
  {id:26, name:"Seaplane Duck", type:"Plane", speed:280, armor:25, seats:6, price:30000, desc:"Land on water"},

  // JETS 3
  {id:27, name:"F-22 Raptor Stealth", type:"Jet", speed:2400, armor:100, seats:1, price:150000, desc:"Air superiority, stealth"},
  {id:28, name:"F-35 Lightning", type:"Jet", speed:1900, armor:90, seats:1, price:120000, desc:"VTOL capable"},
  {id:29, name:"Su-57 Felon", type:"Jet", speed:2200, armor:95, seats:1, price:130000, desc:"Russian stealth"},

  // TANKS 3
  {id:30, name:"M1 Abrams Resilience", type:"Tank", speed:70, armor:500, seats:4, price:100000, desc:"Main battle tank, 120mm"},
  {id:31, name:"T-90 Cartel Crusher", type:"Tank", speed:65, armor:480, seats:3, price:90000, desc:"Russian MBT"},
  {id:32, name:"Light Tank Viper", type:"Tank", speed:90, armor:300, seats:3, price:70000, desc:"Fast light tank with ATGM"},
  
  // EXTRA HEAVY
  {id:33, name:"Mortar Truck 120mm", type:"Heavy", speed:60, armor:150, seats:3, price:40000, desc:"Mobile mortar"},
  {id:34, name:"MLRS Rocket System", type:"Heavy", speed:55, armor:200, seats:3, price:120000, desc:"12x rocket barrage"},
  {id:35, name:"APC Bradley", type:"Heavy", speed:66, armor:350, seats:8, price:85000, desc:"Armored personnel carrier"},
];

export const getVehiclesByType = (t) => VEHICLES.filter(v=>v.type===t);
