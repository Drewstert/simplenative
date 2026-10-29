import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const orange = '#ffa500';
const navy = '#071d5a';
const roundedValue = (value) => Math.round(value);
const formatTickSpeed = (milliseconds) => `${(milliseconds / 1000).toFixed(1)}s`;
const backgrounds = {
  clicker: require('./assets/green-hill.jpg'),
  stats: require('./assets/stats-bg.png'),
  market: require('./assets/black-market.png'),
};

const levels = [
  { name: 'Kronos', rebirths: '2 Rebirths', bonus: 'x3 Passive', image: require('./assets/kronos.jpg') },
  { name: 'City Escape', rebirths: '4 Rebirths', bonus: 'x2 Active', image: require('./assets/windmill-isle.jpg') },
  { name: 'Chemical Plant', rebirths: '6 Rebirths', bonus: 'x3 Red Drop', image: require('./assets/chemical-plant.png') },
  { name: 'Apotos', rebirths: '8 Rebirths', bonus: 'x2 Red Rate', image: require('./assets/apotos.jpg') },
];

const passiveCharacters = [
  { name: 'Chao', cost: 25, gain: 1, color: '#47b9d1' },
  { name: 'Amy Rose', cost: 750, gain: 10, color: '#e95c86' },
  { name: 'Tails', cost: 75000, gain: 100, color: '#e8a52f' },
  { name: 'Knuckles', cost: 25000000, gain: 1000, color: '#d94b47' },
  { name: 'Shadow', cost: 1500000000, gain: 25000, color: '#4d536b' },
];

const activeUpgrades = [
  { name: 'Shield', detail: '+1 RPC', gain: 1, cost: 50, color: '#58aeca' },
  { name: 'Bubble Shield', detail: '+10 RPC', gain: 10, cost: 1000, color: '#79c9e6' },
  { name: 'Fire Shield', detail: '+100 RPC', gain: 100, cost: 100000, color: '#e76b42' },
  { name: 'Lightning Shield', detail: '+1500 RPC', gain: 1500, cost: 50000000, color: '#f3c642' },
  { name: 'Invincibility', detail: '+25000 RPC', gain: 25000, cost: 2500000000, color: '#b67be2' },
];

const statLabels = [
  'Rings/Click',
  'Rings/Second',
  'RedRings/Capsule',
  'Multiplier',
  'Rebirth Multiplier',
  'Seconds/Tick',
];

const characterPositions = [
  styles => styles.characterTopLeft,
  styles => styles.characterTopRight,
  styles => styles.characterLeft,
  styles => styles.characterRight,
  styles => styles.characterBottom,
];

function StatLine({ label, value, valueStyle = styles.statValue }) {
  return (
    <Text style={styles.statLine}>
      {label}: <Text style={valueStyle}>{roundedValue(value)}</Text>
    </Text>
  );
}

function Button({ children, onPress, wide = false }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        wide && styles.wideButton,
        pressed && styles.pressed,
      ]}
    >
      <Text style={styles.buttonText}>{children}</Text>
    </Pressable>
  );
}

function Placeholder({ label = 'IMAGE' }) {
  return (
    <View style={styles.placeholder}>
      <View style={styles.placeholderSun} />
      <View style={styles.placeholderHill} />
      <Text style={styles.placeholderText}>{label}</Text>
    </View>
  );
}

function TopBar({ rings, redRings, onBack, title = 'Sonic Clicker' }) {
  return (
    <View style={styles.topBar}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backArrow}>
          <Text style={styles.backArrowText}>‹</Text>
        </Pressable>
      ) : <View style={styles.backArrow} />}
      <Text style={styles.topTitle}>{title}</Text>
      <View style={styles.currency}>
        <Text style={styles.currencyText}>RINGS: {roundedValue(rings)}</Text>
        <Text style={styles.redCurrency}>RED: {roundedValue(redRings)}</Text>
      </View>
    </View>
  );
}

function CharacterBadges({ characters }) {
  return characters.map((character, index) => (
    <CharacterBadge
      key={character.name}
      character={character}
      count={character.count}
      position={characterPositions[index](styles)}
    />
  ));
}

function CharacterBadge({ character, count, position }) {
  if (!count) return null;
  return (
    <View style={[styles.characterBadge, position]}>
      <View style={[styles.characterIcon, { backgroundColor: character.color }]}>
        <Text style={styles.characterInitial}>{character.name.charAt(0)}</Text>
      </View>
      <Text style={styles.characterCount}>x{count}</Text>
      <Text style={styles.characterName}>{character.name}</Text>
    </View>
  );
}

function ClickerScreen({
  rings,
  redRings,
  ringsPerClick,
  ringsPerSec,
  timeStones,
  timePrice,
  passiveCharacters,
  capsuleVisible,
  onRing,
  onCapsule,
  onTimeStone,
  navigate,
}) {
  return (
    <ImageBackground source={backgrounds.clicker} style={styles.screen} imageStyle={styles.backgroundImage}>
      <TopBar rings={rings} redRings={redRings} title="Sonic Clicker" />
      <ScrollView contentContainerStyle={styles.clickerContent}>
        <View style={styles.clickStats}>
          <Text style={styles.bigStat}>Rings: <Text style={styles.bigStatValue}>{roundedValue(rings)}</Text></Text>
          <StatLine label="Rings Per Click" value={ringsPerClick} />
          <StatLine label="Rings Per Second" value={ringsPerSec} />
          <Text style={styles.redStat}>
            Red Rings: <Text style={styles.redStatValue}>{roundedValue(redRings)}</Text>
          </Text>
          <Text style={styles.statLine}>
            Time Stones: <Text style={styles.statValue}>{timeStones} / 7</Text>
          </Text>
        </View>

        <View style={styles.goalStage}>
          <CharacterBadges characters={passiveCharacters} />
          <Pressable
            onPress={onRing}
            style={({ pressed }) => [styles.goalButton, pressed && styles.goalPressed]}
            accessibilityRole="button"
            accessibilityLabel="Collect rings"
          >
            <Image source={require('./assets/goal-ring.png')} style={styles.goalImage} />
          </Pressable>
        </View>

        {capsuleVisible && (
          <Pressable
            onPress={onCapsule}
            style={({ pressed }) => [styles.capsule, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <Image source={require('./assets/red-capsule.png')} style={styles.capsuleImage} />
            <Text style={styles.capsuleText}>RED RING CAPSULE!</Text>
          </Pressable>
        )}

        <View style={styles.mainButtons}>
          <Button onPress={onTimeStone}>{timeStones === 7 ? 'Rebirth' : `Time Stone: ${timePrice}`}</Button>
          <Button onPress={() => navigate('stats')}>Stats/Save</Button>
          <Button onPress={() => navigate('upgrades')}>Ring Shop</Button>
          <Button onPress={() => navigate('levels')}>Zone Select</Button>
          <Button onPress={() => navigate('redShop')}>Red Ring Shop</Button>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

function LevelsScreen({ navigate }) {
  return (
    <View style={[styles.screen, styles.blueScreen]}>
      <Text style={styles.pageTitle}>Level Select</Text>
      <Button wide onPress={() => navigate('home')}>Return To Default</Button>
      <View style={styles.levelGrid}>
        {levels.map((level) => (
          <View key={level.name} style={styles.level}>
            <Image source={level.image} style={styles.levelImage} />
            <Text style={styles.levelRequirement}>{level.rebirths}{'\n'}{level.bonus}</Text>
            <Button onPress={() => navigate('home')}>{level.name}</Button>
          </View>
        ))}
      </View>
      <Button wide onPress={() => navigate('home')}>Back</Button>
    </View>
  );
}

function UpgradeColumn({ title, upgrades, getDetail, getPrice, onPurchase }) {
  return (
    <View style={styles.upgradeColumn}>
      <Text style={styles.shopColumnTitle}>{title}</Text>
      {upgrades.map((upgrade) => (
        <View style={[styles.shopItem, styles.columnShopItem]} key={upgrade.name}>
          <View style={[styles.shopCharacterIcon, { backgroundColor: upgrade.color }]}>
            <Text style={styles.characterInitial}>{upgrade.name.charAt(0)}</Text>
          </View>
          <Text style={styles.shopName}>{upgrade.name}</Text>
          <Text style={styles.shopDetail}>{getDetail(upgrade)}</Text>
          <Button onPress={() => onPurchase(upgrade)}>
            {roundedValue(getPrice(upgrade))}
          </Button>
        </View>
      ))}
    </View>
  );
}

function MarketScreen({ navigate, page, rings, redRings, passiveCharacters: ownedCharacters, onPurchase, onPurchaseActive, activeUpgradeCosts, redUpgrades, onPurchaseRedUpgrade }) {
  const blackMarket = page === 'redShop';
  const [redShopPage, setRedShopPage] = useState('items');

  const redShopItems = redShopPage === 'items' ? [
     { key: 'speedShoes', name: 'Speed Shoes', detail: 'Red Rings x1.2' },
     { key: 'chaosEmerald', name: 'Chaos Emerald', detail: '+7x', stock: `${redUpgrades.chaosEmerald.stock}/7` },
     { key: 'starfall', name: 'Starfall', detail: '+1x' },
     { key: 'masterEmerald', name: 'Master Emerald', detail: '+50x', stock: `${redUpgrades.masterEmerald.stock}/1` },
     { key: 'chipBracelet', name: "Chip's Bracelet", detail: '+5x', stock: `${redUpgrades.chipBracelet.stock}/1` },
     { key: 'superEmerald', name: 'Super Emerald', detail: '+25x', stock: `${redUpgrades.superEmerald.stock}/7` },
    ] : [
     { key: 'warpTopaz', name: 'Warp Topaz', detail: 'Red ring spawn +0.1%' },
     { key: 'robotTeleporter', name: 'Robot Teleporter', detail: 'Capsule rate +0.5%' },
    ];

  const toggleRedShopPage = () => {
    setRedShopPage((currentPage) => (currentPage === 'items' ? 'rates' : 'items'));
  };

  return (
    <View style={[styles.screen, blackMarket ? styles.marketScreen : styles.ringShopScreen]}>
      {blackMarket && (
        <ImageBackground source={backgrounds.market} style={styles.marketArtwork} imageStyle={styles.marketBackground}>
          <View style={styles.marketHeader}><Text style={styles.marketLogo}>💧 Black Market</Text><Text style={styles.marketJapanese}>闇の取引所</Text></View>
          <View style={styles.marketRedBalance}>
            <Text>RED RINGS</Text>
            <Text style={styles.marketRedCount}>{roundedValue(redRings)}</Text>
          </View>
        </ImageBackground>
      )}
      {!blackMarket && (
        <View style={styles.ringShopHeader}>
          <Text style={styles.ringShopTitle}>Ring Shop</Text>
          <Text style={styles.ringShopSubtitle}>Buy Sonic characters to earn passive rings.</Text>
          <Text style={styles.ringShopBalance}>RINGS: {roundedValue(rings)}</Text>
        </View>
      )}
      <Button onPress={() => navigate('home')}>Back</Button>
      <ScrollView
        style={styles.shopScroll}
        contentContainerStyle={styles.marketBody}
        showsVerticalScrollIndicator
      >
        {blackMarket ? redShopItems.map((item) => (
          <View style={styles.shopItem} key={item.key}>
            <Text style={styles.shopName}>{item.name}</Text>
            <Text style={styles.shopDetail}>{item.detail}</Text>
            {item.stock && <Text style={styles.shopStock}>{item.stock}</Text>}
            <Button onPress={() => onPurchaseRedUpgrade(item)}>
              {redUpgrades[item.key].stock === 0 ? 'Sold Out' : `${roundedValue(redUpgrades[item.key].price)} Red`}
            </Button>
          </View>
        )        ) : (
          <View style={styles.ringShopColumns}>
            <UpgradeColumn
              title="Clicks"
              upgrades={activeUpgrades}
              getDetail={(upgrade) => upgrade.detail}
              getPrice={(upgrade) => activeUpgradeCosts[upgrade.name]}
              onPurchase={onPurchaseActive}
            />
            <UpgradeColumn
              title="Passive"
              upgrades={ownedCharacters}
              getDetail={(character) => `+${character.gain} RPS`}
              getPrice={(character) => character.cost}
              onPurchase={onPurchase}
            />
          </View>
        )}
      </ScrollView>
      {blackMarket && (
        <Button onPress={toggleRedShopPage}>
          {redShopPage === 'items' ? 'Next' : 'Previous'}
        </Button>
      )}
    </View>
  );
}

function StatsScreen({ ringsPerClick, ringsPerSec, redPerEvent, upgradeMult, superMult, tickSpeed, navigate }) {
  const statValues = [
    roundedValue(ringsPerClick),
    roundedValue(ringsPerSec),
    roundedValue(redPerEvent),
    roundedValue(upgradeMult),
    roundedValue(superMult),
    formatTickSpeed(tickSpeed),
  ];

  return (
    <ImageBackground source={backgrounds.stats} style={[styles.screen, styles.statsScreen]}>
      <Text style={styles.pageTitle}>Stats</Text>
      {statLabels.map((label, index) => (
        <View style={styles.statRow} key={label}>
          <Text style={styles.statLabel}>{label}</Text>
          <Text style={styles.statBox}>
            {statValues[index]}
          </Text>
        </View>
      ))}
      <View style={styles.saveRow}>
        <Text style={styles.username}>Username</Text>
        <Button>Save</Button>
      </View>
      <View style={styles.bottomButtons}>
        <Button onPress={() => navigate('home')}>Back</Button>
        <Button onPress={() => navigate('leaderboard')}>Leaderboard</Button>
      </View>
    </ImageBackground>
  );
}

function Leaderboard({ navigate }) {
  return (
    <ImageBackground source={require('./assets/leaderboard-bg.png')} style={styles.screen}>
      <Text style={styles.pageTitle}>LEADERBOARD</Text>
      <View style={styles.table}><Text style={styles.tableHeader}>Username              Rebirths              Rings</Text><Placeholder label="No scores yet" /></View>
      <Button wide onPress={() => navigate('home')}>Back</Button>
    </ImageBackground>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [rings, setRings] = useState(0);
  const [upgrade, setUpgrade] = useState(0);
  const [upgradeMult, setUpgradeMult] = useState(1);
  const [baseMult, setBaseMult] = useState(1);
  const [ringsPerSec, setRingsPerSec] = useState(0);
  const [redDrop, setRedDrop] = useState(2);
  const [rngRed, setRngRed] = useState(20);
  const [clickRedRate, setClickRedRate] = useState(0);
  const [tickSpeed, setTickSpeed] = useState(1000);
  const [timeStones, setTimeStones] = useState(0);
  const [timePrice, setTimePrice] = useState(100);
  const [backgroundMultipliers] = useState({ active: 1, passive: 1, red: 1, redRate: 1 });
  const [superMult, setSuperMult] = useState(1);
  const [redRings, setRedRings] = useState(0);
  const [capsuleVisible, setCapsuleVisible] = useState(false);
  const [redUpgrades, setRedUpgrades] = useState({
    speedShoes: { price: 2, level: 0 },
    starfall: { price: 10, level: 0 },
    chipBracelet: { price: 50, stock: 1 },
    chaosEmerald: { price: 100, stock: 7 },
    masterEmerald: { price: 1000, stock: 1 },
    superEmerald: { price: 1000, stock: 7 },
    warpTopaz: { price: 8, level: 0 },
    robotTeleporter: { price: 8, level: 0 },
  });
  const [ownedCharacters, setOwnedCharacters] = useState(
    passiveCharacters.map((character) => ({ ...character, count: 0 })),
  );
  const [activeUpgradeCosts, setActiveUpgradeCosts] = useState(
    Object.fromEntries(activeUpgrades.map((upgrade) => [upgrade.name, upgrade.cost])),
  );
  const ringsPerClick = (1 + upgrade) * upgradeMult * baseMult * backgroundMultipliers.active * superMult;
  const effectiveRingsPerSec = ringsPerSec * upgradeMult * baseMult * backgroundMultipliers.passive * superMult;

  useEffect(() => {
    const capsuleTick = setInterval(() => {
      if (rngRed >= Math.floor(Math.random() * 1000) || rngRed >= Math.floor(Math.random() * 100000)) {
        setCapsuleVisible(true);
        setTimeout(() => setCapsuleVisible(false), 3000);
      }
    }, tickSpeed);
    return () => clearInterval(capsuleTick);
  }, [rngRed, tickSpeed]);

  useEffect(() => {
    if (!effectiveRingsPerSec) return undefined;
    const passiveTimer = setInterval(() => {
      setRings((value) => value + effectiveRingsPerSec);
    }, tickSpeed);
    return () => clearInterval(passiveTimer);
  }, [effectiveRingsPerSec, tickSpeed]);

  const navigate = (next) => setScreen(next);

  const collectRedRings = () => {
    if (clickRedRate * backgroundMultipliers.redRate < Math.floor(Math.random() * 1000)) return;
    setRedRings((value) => value + (redDrop + baseMult / 2) * backgroundMultipliers.red);
  };

  const collectRings = () => {
    setRings((value) => Math.round(value + ringsPerClick));
    collectRedRings();
  };

  const collectCapsule = () => {
    setRedRings((value) => value + (redDrop + baseMult / 2) * backgroundMultipliers.red);
    setCapsuleVisible(false);
  };

  const purchaseCharacter = (character) => {
    if (rings < character.cost) return;
    setRings((value) => value - character.cost);
    setRingsPerSec((value) => value + character.gain);
    setOwnedCharacters((current) => current.map((owned) => (
      owned.name === character.name ? { ...owned, count: owned.count + 1, cost: owned.cost * 1.2 } : owned
    )));
  };
  const purchaseActiveUpgrade = (upgrade) => {
    const cost = activeUpgradeCosts[upgrade.name];
    if (rings < cost) return;
    setRings((value) => value - cost);
    setUpgrade((value) => value + upgrade.gain);
    setActiveUpgradeCosts((current) => ({
      ...current,
      [upgrade.name]: current[upgrade.name] * 1.2,
    }));
  };
  const purchaseTimeStone = () => {
    if (timeStones >= 7) {
      setBaseMult((value) => value * 2);
      setRings(0);
      setRedRings(0);
      setUpgrade(0);
      setUpgradeMult(1);
      setRingsPerSec(0);
      setRngRed(20);
      setClickRedRate(0);
      setTickSpeed(1000);
      setTimeStones(0);
      setTimePrice(100 * baseMult * 2);
      setOwnedCharacters(passiveCharacters.map((character) => ({ ...character, count: 0 })));
      setActiveUpgradeCosts(Object.fromEntries(activeUpgrades.map((upgrade) => [upgrade.name, upgrade.cost])));
      return;
    }
    if (rings < timePrice) return;
    setRings((value) => Math.round(value - timePrice));
    setTickSpeed((value) => value - 100);
    setTimeStones((value) => value + 1);
    setTimePrice((value) => value * 35);
  };
  const purchaseRedUpgrade = (item) => {
    const upgrade = redUpgrades[item.key];
    if (redRings < upgrade.price || upgrade.stock === 0) return;
    if (item.key === 'superEmerald' && redUpgrades.chaosEmerald.stock + redUpgrades.masterEmerald.stock > 0) return;
    const priceMultiplier = ['warpTopaz', 'robotTeleporter'].includes(item.key) ? 1.8 : 1.5;
    setRedUpgrades((current) => ({
      ...current,
      [item.key]: {
        ...current[item.key],
        price: current[item.key].price * priceMultiplier,
        level: (current[item.key].level || 0) + 1,
        stock: typeof current[item.key].stock === 'number' ? current[item.key].stock - 1 : current[item.key].stock,
      },
    }));
    setRedRings((value) => value - upgrade.price);
    if (item.key === 'speedShoes') setRedDrop((value) => value * 1.2);
    if (item.key === 'warpTopaz') setClickRedRate((value) => value + 1);
    if (item.key === 'robotTeleporter') setRngRed((value) => value + 5);
    if (item.key === 'starfall') setUpgradeMult((value) => value + 1);
    if (item.key === 'chipBracelet') setUpgradeMult((value) => value + 5);
    if (item.key === 'chaosEmerald' && upgrade.stock === 1) setSuperMult(2);
    if (item.key === 'chaosEmerald') setUpgradeMult((value) => value + 7);
    if (item.key === 'masterEmerald') setUpgradeMult((value) => value + 50);
    if (item.key === 'superEmerald' && upgrade.stock === 1) setSuperMult(3);
    if (item.key === 'superEmerald') setUpgradeMult((value) => value + 25);
  };

  const renderScreen = () => {
    if (screen === 'home') {
      return (
        <ClickerScreen
          rings={rings}
          redRings={redRings}
          ringsPerClick={ringsPerClick}
          ringsPerSec={effectiveRingsPerSec}
          timeStones={timeStones}
          timePrice={timePrice}
          passiveCharacters={ownedCharacters}
          capsuleVisible={capsuleVisible}
          onRing={collectRings}
          onCapsule={collectCapsule}
          onTimeStone={purchaseTimeStone}
          navigate={navigate}
        />
      );
    }

    if (screen === 'levels') return <LevelsScreen navigate={navigate} />;
    if (screen === 'stats') {
      return (
        <StatsScreen
          ringsPerClick={ringsPerClick}
          ringsPerSec={effectiveRingsPerSec}
          redPerEvent={(redDrop + baseMult / 2) * backgroundMultipliers.red}
          upgradeMult={upgradeMult}
          superMult={superMult}
          tickSpeed={tickSpeed}
          navigate={navigate}
        />
      );
    }
    if (screen === 'leaderboard') return <Leaderboard navigate={navigate} />;

    return (
      <MarketScreen
        navigate={navigate}
        page={screen}
        rings={rings}
        redRings={redRings}
        passiveCharacters={ownedCharacters}
        activeUpgradeCosts={activeUpgradeCosts}
        redUpgrades={redUpgrades}
        onPurchase={purchaseCharacter}
        onPurchaseActive={purchaseActiveUpgrade}
        onPurchaseRedUpgrade={purchaseRedUpgrade}
      />
    );
  };

  const content = renderScreen();

  return <SafeAreaView style={styles.safeArea}><StatusBar style="light" />{content}</SafeAreaView>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#18214a' },
  screen: { flex: 1, padding: 8, alignItems: 'center' },
  backgroundImage: { opacity: 0.88 },
  blueScreen: { backgroundColor: '#7fc5f5' },
  topBar: { width: '100%', minHeight: 55, backgroundColor: 'rgba(5, 28, 91, .94)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  topTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  backArrow: { width: 38 },
  backArrowText: { color: '#fff', fontSize: 38, lineHeight: 38 },
  currency: { alignItems: 'flex-end' },
  currencyText: { color: '#fff', fontSize: 12, fontWeight: '900' },
  redCurrency: { color: '#ff5964', fontSize: 10, fontWeight: '900' },
  clickerContent: { width: '100%', alignItems: 'center', paddingBottom: 15 },
  clickStats: { width: '100%', backgroundColor: 'rgba(13, 36, 116, .85)', padding: 7 },
  bigStat: { color: '#fff', fontSize: 24, fontWeight: '900' },
  bigStatValue: { color: '#ffe75c' },
  statLine: { color: '#fff', fontSize: 15, fontWeight: '900', marginTop: 4 },
  statValue: { color: '#ffe75c' },
  redStat: { color: '#ff4051', fontSize: 17, fontWeight: '900', marginTop: 5 },
  redStatValue: { color: '#fff' },
  goalStage: { width: '100%', height: 245, position: 'relative', alignItems: 'center', justifyContent: 'center' },
  goalButton: { width: 200, height: 200, borderRadius: 75, alignItems: 'center', justifyContent: 'center' },
  goalPressed: { transform: [{ scale: 0.94 }] },
  goalImage: { width: 200, height: 200, resizeMode: 'contain' },
  characterBadge: { position: 'absolute', width: 70, alignItems: 'center', zIndex: 2 },
  characterTopLeft: { top: 8, left: 18 },
  characterTopRight: { top: 8, right: 18 },
  characterLeft: { left: 8, top: 91 },
  characterRight: { right: 8, top: 91 },
  characterBottom: { bottom: 3, left: '42%' },
  characterIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  characterInitial: { color: '#fff', fontSize: 22, fontWeight: '900' },
  characterCount: { color: '#fff', backgroundColor: navy, borderRadius: 8, paddingHorizontal: 5, fontSize: 12, fontWeight: '900', marginTop: -7 },
  characterName: { color: navy, fontSize: 9, fontWeight: '900', textAlign: 'center', marginTop: 2 },
  collectibleGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', backgroundColor: 'rgba(205, 215, 227, .68)' },
  collectible: { width: '50%', height: 110, borderWidth: 1, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  collectibleImage: { width: 70, height: 70, resizeMode: 'contain' },
  collectibleCount: { position: 'absolute', right: 12, bottom: 8, color: '#fff', fontSize: 18, fontWeight: '900' },
  placeholder: { width: '100%', height: '100%', backgroundColor: '#d8e0e8', overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
  placeholderSun: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: '#e8b848', top: 16, right: 20 },
  placeholderHill: { width: '130%', height: 45, backgroundColor: '#95a9b5', transform: [{ rotate: '-13deg' }], marginBottom: 25 },
  placeholderText: { position: 'absolute', bottom: 8, color: '#687989', fontSize: 11, fontWeight: '900', backgroundColor: 'rgba(255,255,255,.75)', paddingHorizontal: 5 },
  capsule: { backgroundColor: '#20283e', borderWidth: 3, borderColor: '#ef3340', borderRadius: 14, padding: 8, alignItems: 'center', marginVertical: 8 },
  capsuleImage: { width: 84, height: 72, resizeMode: 'contain' },
  capsuleText: { color: '#fff', fontWeight: '900', fontSize: 12 },
  mainButtons: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  button: { backgroundColor: orange, borderColor: '#9b6500', borderWidth: 1, borderRadius: 5, minWidth: 112, paddingHorizontal: 10, paddingVertical: 10, alignItems: 'center', margin: 4 },
  wideButton: { minWidth: 132 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  pressed: { opacity: 0.65 },
  pageTitle: { color: '#4a5360', fontSize: 31, fontWeight: '900', textAlign: 'center', marginVertical: 8 },
  levelGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', flex: 1 },
  level: { width: '46%', alignItems: 'center', marginVertical: 5 },
  levelImage: { width: 86, height: 125, resizeMode: 'cover' },
  levelRequirement: { color: '#4b5663', fontSize: 15, fontWeight: '900', textAlign: 'center', marginVertical: 3 },
  marketScreen: { backgroundColor: '#45465f', alignItems: 'stretch' },
  ringShopScreen: { backgroundColor: '#db686d', alignItems: 'stretch' },
  marketArtwork: { width: '100%', height: 245 },
  ringShopHeader: { width: '100%', backgroundColor: 'rgba(255, 255, 255, .75)', borderBottomWidth: 2, borderColor: '#fff', padding: 14 },
  ringShopTitle: { color: '#b52432', fontSize: 28, fontWeight: '900' },
  ringShopSubtitle: { color: '#fff', fontSize: 14, fontWeight: '900', marginTop: 4 },
  ringShopBalance: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 8 },
  marketBackground: { opacity: 0.9 },
  marketHeader: { backgroundColor: '#a82e3a', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row', justifyContent: 'space-between' },
  marketLogo: { color: '#fff', fontSize: 22, fontWeight: '900' },
  marketJapanese: { color: '#fff', fontSize: 14, fontWeight: '900' },
  marketWelcomeRow: { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'flex-end', marginTop: 155 },
  marketWelcome: { flex: 1, backgroundColor: '#b83440', padding: 10 },
  marketRedBalance: { width: '30%', height: 50, backgroundColor: '#b83440', padding: 0, alignItems: 'center', justifyContent: 'center' },
  marketRedCount: { color: '#fff', fontSize: 18, fontWeight: '900', marginTop: 3 },
  marketWelcomeText: { color: '#fff', fontSize: 15 },
  marketBody: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginTop: 10 },
  shopScroll: { width: '100%', flex: 1 },
  ringShopColumns: { width: '100%', flexDirection: 'row', justifyContent: 'space-between' },
  upgradeColumn: { width: '49%', alignItems: 'center' },
  columnShopItem: { width: '100%' },
  shopColumnTitle: { width: '100%', color: '#fff', backgroundColor: '#d55f65', borderWidth: 1, borderColor: '#fff', fontSize: 20, fontWeight: '900', textAlign: 'center', paddingVertical: 5, marginBottom: 4 },
  shopItem: { width: '46%', alignItems: 'center', marginBottom: 8 },
  shopCharacterIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', marginBottom: 3 },
  shopName: { color: '#fff', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  shopDetail: { color: '#fff', fontSize: 14, fontWeight: '900', textAlign: 'center', minHeight: 34 },
  shopStock: { color: '#fff', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  statsScreen: { backgroundColor: 'rgba(194, 205, 211, .9)', alignItems: 'stretch' },
  statRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  statLabel: { flex: 1, backgroundColor: orange, borderRadius: 15, borderWidth: 1, padding: 5, color: '#33445b', fontSize: 17, fontWeight: '900', textAlign: 'center' },
  statBox: { flex: 0.7, backgroundColor: '#000', borderRadius: 15, color: '#fff', fontSize: 16, fontWeight: '900', textAlign: 'center', padding: 6, marginLeft: 12 },
  saveRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', marginTop: 24 },
  username: { backgroundColor: '#fff', borderWidth: 1, borderRadius: 4, padding: 12, color: '#78818d', width: '68%' },
  bottomButtons: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 25 },
  table: { flex: 1, width: '100%', borderWidth: 1, borderColor: '#fff', backgroundColor: 'rgba(210, 221, 235, .62)' },
  tableHeader: { color: '#4a5360', fontSize: 16, fontWeight: '900', padding: 8, textAlign: 'center' },
});
