import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  ActivityIndicator,
  Image,
  ImageBackground,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { supabase } from './lib/supabase';
import { loadGame, loadLeaderboard, saveGame } from './lib/gameData';

const orange = '#ffa500';
const navy = '#071d5a';
const roundedValue = (value) => Math.round(value);
const getRedDropForLevel = (level) => roundedValue(2 * (1.3 ** level));
const timeStoneTickBoost = 155;
const getTickSpeedForTimeStones = (count) => Math.max(1, 1000 - count * timeStoneTickBoost);
const formatDisplayNumber = (value) => {
  const rounded = roundedValue(value);
  return Math.abs(rounded) >= 1000000000
    ? rounded.toExponential(2).replace('e+', 'e')
    : rounded.toLocaleString('en-US');
};
const roundIfNumber = (value) => (typeof value === 'number' ? roundedValue(value) : value);
const formatTickSpeed = (milliseconds) => `${(milliseconds / 1000).toFixed(3)}s`;
const roundGameState = (game) => ({
  ...game,
  rings: roundedValue(game.rings),
  redRings: roundedValue(game.redRings),
  upgrade: roundedValue(game.upgrade),
  upgradeMult: roundedValue(game.upgradeMult),
  baseMult: roundedValue(game.baseMult),
  ringsPerSec: roundedValue(game.ringsPerSec),
  redDrop: roundedValue(game.redDrop),
  rngRed: roundedValue(game.rngRed),
  clickRedRate: roundedValue(game.clickRedRate),
  timeStones: roundedValue(game.timeStones),
  timePrice: roundedValue(game.timePrice),
  tickSpeed: typeof game.tickSpeed === 'number' ? game.tickSpeed : 1000,
  superMult: roundedValue(game.superMult),
  redUpgrades: game.redUpgrades
    ? Object.fromEntries(
      Object.entries(game.redUpgrades).map(([key, upgrade]) => [
        key,
        { ...upgrade, price: roundedValue(upgrade.price), level: roundIfNumber(upgrade.level) },
      ]),
    )
    : undefined,
  ownedCharacters: game.ownedCharacters
    ? game.ownedCharacters.map((character) => ({
      ...character,
      count: roundedValue(character.count),
      cost: roundedValue(character.cost),
      gain: roundedValue(character.gain),
    }))
    : undefined,
  activeUpgradeCosts: game.activeUpgradeCosts
    ? Object.fromEntries(
      Object.entries(game.activeUpgradeCosts).map(([name, cost]) => [name, roundedValue(cost)]),
    )
    : undefined,
  activeUpgradeLevels: game.activeUpgradeLevels
    ? Object.fromEntries(
      Object.entries(game.activeUpgradeLevels).map(([name, level]) => [name, roundedValue(level)]),
    )
    : undefined,
});
const backgrounds = {
  clicker: require('./assets/green-hill.jpg'),
  stats: require('./assets/stats-bg.png'),
  market: require('./assets/black-market.png'),
};
const chaosEmeraldImages = [
  require('./assets/Chaos_Emerald 1.png'),
  require('./assets/Chaos_Emerald 2.png'),
  require('./assets/Chaos_Emerald 3.png'),
  require('./assets/Chaos_Emerald 4.png'),
  require('./assets/Chaos_Emerald 5.png'),
  require('./assets/Chaos_Emerald 6.png'),
  require('./assets/Chaos_Emerald 7.png'),
];

const levels = [
  { name: 'Kronos', requiredRebirths: 2, bonus: 'x3 Passive', passive: 3, image: require('./assets/kronos.jpg') },
  { name: 'City Escape', requiredRebirths: 4, bonus: 'x2 Active', active: 2, image: require('./assets/windmill-isle.jpg') },
  { name: 'Chemical Plant', requiredRebirths: 6, bonus: 'x3 Red Drop', red: 3, image: require('./assets/chemical-plant.png') },
  { name: 'Apotos', requiredRebirths: 8, bonus: 'x2 Red Rate', redRate: 2, image: require('./assets/apotos.jpg') },
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

const createRedUpgrades = () => ({
  speedShoes: { price: 2, level: 0 },
  starfall: { price: 10, level: 0 },
  chipBracelet: { price: 50, stock: 1 },
  chaosEmerald: { price: 100, stock: 7 },
  masterEmerald: { price: 1000, stock: 1 },
  superEmerald: { price: 1000, stock: 7 },
  warpTopaz: { price: 8, level: 0 },
  robotTeleporter: { price: 8, level: 0 },
});

const redUpgradePriceMultipliers = {
  speedShoes: 1.5,
  starfall: 1.5,
  chipBracelet: 1.5,
  chaosEmerald: 1.5,
  masterEmerald: 1.5,
  superEmerald: 1.5,
  warpTopaz: 1.8,
  robotTeleporter: 1.8,
};

const rebuildRedUpgrades = (savedUpgrades) => {
  const defaults = createRedUpgrades();
  return Object.fromEntries(Object.entries(defaults).map(([key, defaultUpgrade]) => {
    const savedUpgrade = savedUpgrades?.[key] || defaultUpgrade;
    const level = savedUpgrade.level || 0;
    return [key, {
      ...defaultUpgrade,
      ...savedUpgrade,
      price: roundedValue(
        defaultUpgrade.price * (redUpgradePriceMultipliers[key] ** level),
      ),
      level,
    }];
  }));
};

const rebuildActiveUpgradeState = (levels) => ({
  upgrade: activeUpgrades.reduce(
    (total, upgrade) => total + upgrade.gain * (levels[upgrade.name] || 0),
    0,
  ),
  costs: Object.fromEntries(
    activeUpgrades.map((upgrade) => [
      upgrade.name,
      roundedValue(upgrade.cost * (1.2 ** (levels[upgrade.name] || 0))),
    ]),
  ),
});

const rebuildPassiveCharacters = (savedCharacters) => passiveCharacters.map((character) => {
  const savedCharacter = savedCharacters?.find((saved) => saved.name === character.name);
  const count = savedCharacter?.count || 0;
  return {
    ...character,
    count,
    cost: roundedValue(character.cost * (1.2 ** count)),
  };
});

const characterPositions = [
  styles => styles.characterLeft,
  styles => styles.characterTopLeft,
  styles => styles.characterTop,
  styles => styles.characterTopRight,
  styles => styles.characterRight,
];

function StatLine({ label, value, valueStyle = styles.statValue }) {
  return (
    <Text style={styles.statLine}>
      {label}: <Text style={valueStyle}>{formatDisplayNumber(value)}</Text>
    </Text>
  );
}

function Button({ children, onPress, wide = false, disabled = false }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.button,
        wide && styles.wideButton,
        disabled && styles.disabledButton,
        pressed && !disabled && styles.buttonPressed,
      ]}
    >
      <Text style={styles.buttonText}>
        {typeof children === 'number' ? formatDisplayNumber(children) : children}
      </Text>
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

function TopBar({ onBack, title = 'Sonic Clicker' }) {
  return (
    <View style={styles.topBar}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backArrow}>
          <Text style={styles.backArrowText}>‹</Text>
        </Pressable>
      ) : <View style={styles.backArrow} />}
      <Text style={styles.topTitle}>{title}</Text>
      <View style={styles.topBarSpacer} />
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
  redRingDrop,
  redRingClickRate,
  capsuleSpawnRate,
  rebirths,
  superMult,
  currentZone,
  chaosEmeraldsOwned,
  superEmeraldsOwned,
  ringsPerClick,
  ringsPerSec,
  timeStones,
  timePrice,
  passiveCharacters,
  backgroundSource,
  capsuleVisible,
  capsulePosition,
  onRing,
  onCapsule,
  onTimeStone,
  navigate,
}) {
  return (
    <ImageBackground source={backgroundSource} style={styles.screen} imageStyle={styles.backgroundImage}>
      <TopBar title="Sonic Clicker" />
      <View style={styles.clickerContent}>
        <View style={styles.clickStats}>
          <Text style={styles.statsTitle}>GAME STATS</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>RINGS</Text>
              <Text style={styles.statCardValue}>{formatDisplayNumber(rings)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>RINGS / CLICK</Text>
              <Text style={styles.statCardValue}>{formatDisplayNumber(ringsPerClick)}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>RINGS / SECOND</Text>
              <Text style={styles.statCardValue}>{formatDisplayNumber(ringsPerSec)}</Text>
            </View>
            <View style={[styles.statCard, styles.redStatCard]}>
              <Text style={styles.statCardLabel}>RED RINGS</Text>
              <Text style={styles.statCardValue}>{formatDisplayNumber(redRings)}</Text>
            </View>
            <View style={[styles.statCard, styles.redStatCard]}>
              <Text style={styles.statCardLabel}>RED RINGS / DROP</Text>
              <Text style={styles.statCardValue}>{formatDisplayNumber(redRingDrop)}</Text>
            </View>
            <View style={[styles.statCard, styles.redStatCard]}>
              <Text style={styles.statCardLabel}>RED RING CHANCE / CLICK</Text>
              <Text style={styles.statCardValue}>{(redRingClickRate / 10).toFixed(1)}%</Text>
            </View>
            <View style={[styles.statCard, styles.redStatCard]}>
              <Text style={styles.statCardLabel}>CAPSULE CHANCE / TICK</Text>
              <Text style={styles.statCardValue}>{(capsuleSpawnRate / 10).toFixed(1)}%</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>TIME STONES</Text>
              <Text style={styles.statCardValue}>{timeStones}/7</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statCardLabel}>REBIRTHS</Text>
              <Text style={styles.statCardValue}>{rebirths}</Text>
            </View>
          </View>
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
          <View style={styles.emeraldRow}>
            {chaosEmeraldImages.slice(0, chaosEmeraldsOwned).map((emerald, index) => (
              <Image
                key={`chaos-emerald-${index + 1}`}
                source={emerald}
                style={[
                  styles.emeraldImage,
                  index < superEmeraldsOwned && styles.superEmeraldBoosted,
                ]}
              />
            ))}
          </View>
          {capsuleVisible && (
            <Pressable
              onPress={onCapsule}
              style={({ pressed }) => [
                styles.capsule,
                capsulePosition,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              <Image source={require('./assets/red-capsule.png')} style={styles.capsuleImage} />
              <Text style={styles.capsuleText}>RED RING CAPSULE!</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.rebirthInfo}>
          <Text style={styles.rebirthInfoTitle}>REBIRTH MECHANICS</Text>
          <Text style={styles.rebirthInfoText}>
            Each Time Stone reduces the tick delay by 0.155 seconds. Buy 7 Time Stones to rebirth.
            Rebirthing resets your rings, upgrades, characters, and speed, but permanently doubles your ring multiplier
            and unlocks new zones.
          </Text>
          <Text style={styles.rebirthInfoProgress}>
            Time Stones: {timeStones}/7
          </Text>
        </View>

        <View style={styles.formZoneRow}>
          <View style={styles.formInfo}>
            <Text style={styles.formInfoLabel}>CURRENT FORM</Text>
            <Text style={styles.formDisplay}>
              {superMult >= 3 ? 'Hyper' : superMult >= 2 ? 'Super' : 'Base'} Form
            </Text>
            <Text style={styles.formMultiplier}>{formatDisplayNumber(superMult)}x multiplier</Text>
          </View>
          <View style={styles.formInfo}>
            <Text style={styles.formInfoLabel}>CURRENT ZONE</Text>
            <Text style={styles.formDisplay}>{currentZone || 'Green Hill'}</Text>
          </View>
        </View>

        <View style={styles.mainButtons}>
          <Button onPress={onTimeStone}>{timeStones === 7 ? 'Rebirth' : `Time Stone: ${formatDisplayNumber(timePrice)}`}</Button>
          <Button onPress={() => navigate('stats')}>Stats/Save</Button>
          <Button onPress={() => navigate('upgrades')}>Ring Shop</Button>
          <Button onPress={() => navigate('levels')}>Zone Select</Button>
          <Button onPress={() => navigate('redShop')}>Red Ring Shop</Button>
        </View>
      </View>
    </ImageBackground>
  );
}

function LevelsScreen({ navigate, rebirths, selectedZone, onSelectZone }) {
  return (
    <View style={[styles.screen, styles.zoneScreen]}>
      <TopBar title="Zone Select" onBack={() => navigate('home')} />
      <ScrollView
        style={styles.zoneScroll}
        contentContainerStyle={styles.zoneContent}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        <View style={styles.zoneHeader}>
          <Text style={styles.zoneTitle}>CHOOSE YOUR ZONE</Text>
          <Text style={styles.zoneSubtitle}>Unlock new areas to boost your production.</Text>
          <View style={styles.zoneProgressRow}>
            <View style={styles.zoneProgressCard}>
              <Text style={styles.zoneProgressLabel}>REBIRTHS</Text>
              <Text style={styles.zoneProgressValue}>{rebirths}</Text>
            </View>
            <View style={styles.zoneProgressCard}>
              <Text style={styles.zoneProgressLabel}>CURRENT ZONE</Text>
              <Text style={styles.zoneProgressValue}>{selectedZone || 'Green Hill'}</Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={() => onSelectZone(null)}
          style={({ pressed }) => [
            styles.greenHillOption,
            !selectedZone && styles.selectedZoneCard,
            pressed && styles.buttonPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Select Green Hill"
        >
          <View>
            <Text style={styles.zoneCardTitle}>Green Hill</Text>
            <Text style={styles.zoneCardDescription}>Your starting zone</Text>
          </View>
          <Text style={styles.zoneStatus}>{!selectedZone ? 'ACTIVE' : 'SELECT'}</Text>
        </Pressable>

        <Text style={styles.zoneListTitle}>UNLOCKED ZONES</Text>
        <View style={styles.levelGrid}>
          {levels.map((level) => {
            const locked = rebirths < level.requiredRebirths;
            const selected = selectedZone === level.name;
            return (
              <View style={[styles.level, locked && styles.lockedLevel]} key={level.name}>
                <Image source={level.image} style={styles.levelImage} />
                <View style={styles.levelInfo}>
                  <Text style={styles.levelName}>{level.name}</Text>
                  <Text style={styles.levelBonus}>{level.bonus}</Text>
                  <Text style={styles.levelRequirement}>
                    {locked ? `${level.requiredRebirths} rebirths required` : 'Unlocked'}
                  </Text>
                  <Button
                    disabled={locked}
                    onPress={() => onSelectZone(level.name)}
                  >
                    {locked ? 'Locked' : selected ? 'Selected' : 'Select'}
                  </Button>
                </View>
              </View>
            );
          })}
        </View>
        <Button wide onPress={() => navigate('home')}>Back to Game</Button>
      </ScrollView>
    </View>
  );
}

function UpgradeColumn({ title, upgrades, getDetail, getPrice, getLevel, onPurchase }) {
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
          <Text style={styles.shopLevel}>Level {getLevel(upgrade)}</Text>
          <Button onPress={() => onPurchase(upgrade)}>
            {formatDisplayNumber(getPrice(upgrade))}
          </Button>
        </View>
      ))}
    </View>
  );
}

function MarketScreen({
  navigate,
  page,
  rings,
  redRings,
  passiveCharacters: ownedCharacters,
  activeUpgradeLevels,
  onPurchase,
  onPurchaseActive,
  activeUpgradeCosts,
  redUpgrades,
  onPurchaseRedUpgrade,
}) {
  const blackMarket = page === 'redShop';
  const [redShopPage, setRedShopPage] = useState('items');

  const redShopItems = redShopPage === 'items' ? [
     { key: 'speedShoes', name: 'Speed Shoes', detail: 'Red Rings x1.3' },
     { key: 'chaosEmerald', name: 'Chaos Emerald', detail: '+7x', stock: `${redUpgrades.chaosEmerald.stock}/7` },
     { key: 'starfall', name: 'Starfall', detail: '+1x' },
     { key: 'masterEmerald', name: 'Master Emerald', detail: '+50x', stock: `${redUpgrades.masterEmerald.stock}/1` },
     { key: 'chipBracelet', name: "Chip's Bracelet", detail: '+5x', stock: `${redUpgrades.chipBracelet.stock}/1` },
     {
       key: 'superEmerald',
       name: 'Super Emerald',
       detail: 'Requires all 7 Chaos Emeralds and the Master Emerald',
       stock: `${redUpgrades.superEmerald.stock}/7`,
     },
    ] : [
     { key: 'warpTopaz', name: 'Warp Topaz', detail: 'Red ring spawn +0.1%' },
     { key: 'robotTeleporter', name: 'Robot Teleporter', detail: 'Capsule rate +0.5%' },
    ];

  const toggleRedShopPage = () => {
    setRedShopPage((currentPage) => (currentPage === 'items' ? 'rates' : 'items'));
  };
  const superEmeraldLocked = redUpgrades.chaosEmerald.stock > 0 || redUpgrades.masterEmerald.stock > 0;

  return (
    <View style={[styles.screen, blackMarket ? styles.marketScreen : styles.ringShopScreen]}>
      {blackMarket && (
        <ImageBackground source={backgrounds.market} style={styles.marketArtwork} imageStyle={styles.marketBackground}>
          <View style={styles.marketHeader}><Text style={styles.marketLogo}>💧 Black Market</Text><Text style={styles.marketJapanese}>闇の取引所</Text></View>
          <View style={styles.marketRedBalance}>
            <Text style={styles.marketRedLabel}>RED RINGS</Text>
            <Text style={styles.marketRedCount}>{formatDisplayNumber(redRings)}</Text>
          </View>
        </ImageBackground>
      )}
      {!blackMarket && (
        <View style={styles.ringShopHeader}>
          <Text style={styles.ringShopTitle}>Ring Shop</Text>
          <Text style={styles.ringShopSubtitle}>Buy Sonic characters to earn passive rings.</Text>
          <Text style={styles.ringShopBalance}>RINGS: {formatDisplayNumber(rings)}</Text>
        </View>
      )}
      <Button onPress={() => navigate('home')}>Back</Button>
      <ScrollView
        style={styles.shopScroll}
        contentContainerStyle={styles.marketBody}
        showsVerticalScrollIndicator
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        {blackMarket ? redShopItems.map((item) => (
          <View style={styles.shopItem} key={item.key}>
            <Text style={styles.shopName}>{item.name}</Text>
            <Text style={styles.shopDetail}>{item.detail}</Text>
            {!item.stock && <Text style={styles.shopLevel}>Level {redUpgrades[item.key].level || 0}</Text>}
            {item.stock && <Text style={styles.shopStock}>{item.stock}</Text>}
            <Button
              onPress={() => onPurchaseRedUpgrade(item)}
              disabled={item.key === 'superEmerald' && superEmeraldLocked}
            >
              {item.key === 'superEmerald' && superEmeraldLocked
                ? 'Locked'
                : redUpgrades[item.key].stock === 0
                  ? 'Sold Out'
                  : `${formatDisplayNumber(redUpgrades[item.key].price)} Red`}
            </Button>
          </View>
        )        ) : (
          <View style={styles.ringShopColumns}>
            <UpgradeColumn
              title="Clicks"
              upgrades={activeUpgrades}
              getDetail={(upgrade) => upgrade.detail}
              getPrice={(upgrade) => activeUpgradeCosts[upgrade.name]}
              getLevel={(upgrade) => activeUpgradeLevels[upgrade.name] || 0}
              onPurchase={onPurchaseActive}
            />
            <UpgradeColumn
              title="Passive"
              upgrades={ownedCharacters}
              getDetail={(character) => `+${formatDisplayNumber(character.gain)} RPS`}
              getPrice={(character) => character.cost}
              getLevel={(character) => character.count}
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

function StatsScreen({
  rings,
  redRings,
  upgrade,
  ringsPerClick,
  ringsPerSec,
  redPerEvent,
  redDrop,
  redChance,
  capsuleChance,
  upgradeMult,
  baseMult,
  superMult,
  tickSpeed,
  timeStones,
  timePrice,
  rebirths,
  selectedZone,
  chaosEmeraldsOwned,
  superEmeraldsOwned,
  masterEmeraldOwned,
  username,
  setUsername,
  onSave,
  saveStatus,
  onLeaderboard,
  navigate,
}) {
  const statGroups = [
    {
      title: 'PROGRESS',
      accent: styles.statsAccentGold,
      stats: [
        ['Rings', formatDisplayNumber(rings)],
        ['Red Rings', formatDisplayNumber(redRings)],
        ['Rebirths', formatDisplayNumber(rebirths)],
        ['Current Zone', selectedZone || 'Green Hill'],
        ['Time Stones', `${timeStones}/7`],
        ['Next Time Stone', timeStones === 7 ? 'Ready' : formatDisplayNumber(timePrice)],
      ],
    },
    {
      title: 'PRODUCTION',
      accent: styles.statsAccentBlue,
      stats: [
        ['Rings / Click', formatDisplayNumber(ringsPerClick)],
        ['Rings / Second', formatDisplayNumber(ringsPerSec)],
        ['Active Ring Bonus', `+${formatDisplayNumber(upgrade)}`],
        ['Active Multiplier', `${formatDisplayNumber(upgradeMult)}x`],
        ['Base Multiplier', `${formatDisplayNumber(baseMult)}x`],
        ['Seconds / Tick', formatTickSpeed(tickSpeed)],
      ],
    },
    {
      title: 'RED RING SYSTEM',
      accent: styles.statsAccentRed,
      stats: [
        ['Red Rings / Drop', formatDisplayNumber(redPerEvent)],
        ['Red Rings / Click', `${(redChance / 10).toFixed(1)}%`],
        ['Capsule Chance / Tick', `${(capsuleChance / 10).toFixed(1)}%`],
        ['Red Drop Upgrade', formatDisplayNumber(redDrop)],
        ['Chaos Emeralds', `${chaosEmeraldsOwned}/7`],
        ['Super Emeralds', `${superEmeraldsOwned}/7`],
        ['Master Emerald', masterEmeraldOwned ? 'Obtained' : 'Not obtained'],
      ],
    },
    {
      title: 'FORMS & UPGRADES',
      accent: styles.statsAccentPurple,
      stats: [
        ['Current Form', superMult >= 3 ? 'Hyper' : superMult >= 2 ? 'Super' : 'Base'],
        ['Form Multiplier', `${formatDisplayNumber(superMult)}x`],
      ],
    },
  ];

  return (
    <ImageBackground source={backgrounds.stats} style={[styles.screen, styles.statsScreen]}>
      <TopBar title="Stats & Save" onBack={() => navigate('home')} />
      <ScrollView
        style={styles.statsScroll}
        contentContainerStyle={styles.statsContent}
        bounces={false}
        alwaysBounceVertical={false}
        overScrollMode="never"
      >
        <Text style={styles.statsIntro}>Your complete game overview</Text>
        {statGroups.map((group) => (
          <View style={styles.statsGroup} key={group.title}>
            <Text style={[styles.statsGroupTitle, group.accent]}>{group.title}</Text>
            <View style={styles.statsCardGrid}>
              {group.stats.map(([label, value]) => (
                <View style={styles.statsTile} key={label}>
                  <Text style={styles.statsTileLabel}>{label}</Text>
                  <Text style={styles.statsTileValue} numberOfLines={1}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}
        <View style={styles.savePanel}>
          <Text style={styles.saveTitle}>SAVE GAME</Text>
          <TextInput
            value={username}
            onChangeText={setUsername}
            placeholder="Enter username"
            placeholderTextColor="#9aa7c2"
            style={styles.username}
            maxLength={24}
          />
          <Button wide onPress={onSave}>Save Progress</Button>
          {saveStatus ? <Text style={styles.saveStatus}>{saveStatus}</Text> : null}
        </View>
        <View style={styles.statsActions}>
          <Button onPress={() => navigate('home')}>Back</Button>
          <Button onPress={onLeaderboard}>Leaderboard</Button>
        </View>
      </ScrollView>
    </ImageBackground>
  );
}

function Leaderboard({ rows, loading, error, navigate }) {
  return (
    <ImageBackground source={require('./assets/leaderboard-bg.png')} style={styles.screen}>
      <Text style={styles.pageTitle}>LEADERBOARD</Text>
      <View style={styles.table}>
        <Text style={styles.tableHeader}>Username                 Rebirths        Rings</Text>
        {loading ? <ActivityIndicator size="large" color="#071d5a" /> : null}
        {error ? <Text style={styles.saveStatus}>{error}</Text> : null}
        {!loading && !error && rows.length === 0 ? <Placeholder label="No scores yet" /> : null}
        {rows.map((row, index) => (
          <View style={styles.leaderboardRow} key={`${row.username}-${index}`}>
            <Text style={styles.leaderboardCell}>{row.username}</Text>
            <Text style={styles.leaderboardCell}>{row.rebirths}</Text>
            <Text style={styles.leaderboardCell}>{formatDisplayNumber(row.rings)}</Text>
          </View>
        ))}
      </View>
      <Button wide onPress={() => navigate('home')}>Back</Button>
    </ImageBackground>
  );
}

export default function App() {
  const [screen, setScreen] = useState('home');
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('Anonymous');
  const [saveStatus, setSaveStatus] = useState('');
  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardError, setLeaderboardError] = useState('');
  const userRef = useRef(null);
  const gameSnapshotRef = useRef(null);
  const saveInProgressRef = useRef(false);
  const [rings, setRings] = useState(0);
  const [upgrade, setUpgrade] = useState(0);
  const [upgradeMult, setUpgradeMult] = useState(1);
  const [baseMult, setBaseMult] = useState(1);
  const [rebirths, setRebirths] = useState(0);
  const [ringsPerSec, setRingsPerSec] = useState(0);
  const [redDrop, setRedDrop] = useState(2);
  const [rngRed, setRngRed] = useState(20);
  const [clickRedRate, setClickRedRate] = useState(0);
  const [tickSpeed, setTickSpeed] = useState(1000);
  const [timeStones, setTimeStones] = useState(0);
  const [timePrice, setTimePrice] = useState(100);
  const [selectedZone, setSelectedZone] = useState(null);
  const [superMult, setSuperMult] = useState(1);
  const [redRings, setRedRings] = useState(0);
  const [capsuleVisible, setCapsuleVisible] = useState(false);
  const [capsulePosition, setCapsulePosition] = useState({ left: '20%', top: '10%' });
  const capsuleVisibleRef = useRef(false);
  const capsuleTimeoutRef = useRef(null);
  const [redUpgrades, setRedUpgrades] = useState(createRedUpgrades);
  const [ownedCharacters, setOwnedCharacters] = useState(
    passiveCharacters.map((character) => ({ ...character, count: 0 })),
  );
  const [activeUpgradeCosts, setActiveUpgradeCosts] = useState(
    Object.fromEntries(activeUpgrades.map((upgrade) => [upgrade.name, upgrade.cost])),
  );
  const [activeUpgradeLevels, setActiveUpgradeLevels] = useState(
    Object.fromEntries(activeUpgrades.map((upgrade) => [upgrade.name, 0])),
  );
  const activeLevel = levels.find((level) => level.name === selectedZone);
  const backgroundMultipliers = {
    active: activeLevel?.active || 1,
    passive: activeLevel?.passive || 1,
    red: activeLevel?.red || 1,
    redRate: activeLevel?.redRate || 1,
  };
  const backgroundSource = activeLevel?.image || backgrounds.clicker;
  const ringsPerClick = roundedValue((1 + upgrade) * upgradeMult * baseMult * backgroundMultipliers.active * superMult);
  const effectiveRingsPerSec = roundedValue(ringsPerSec * upgradeMult * baseMult * backgroundMultipliers.passive * superMult);
  const effectiveRedRingDrop = roundedValue(redDrop * baseMult * backgroundMultipliers.red);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      let currentUser = sessionData.session?.user;
      if (!currentUser) {
        const { data, error } = await supabase.auth.signInAnonymously();
        if (error) throw error;
        currentUser = data.user;
      }

      if (!active || !currentUser) return;
      setUser(currentUser);
      userRef.current = currentUser;

      const savedGame = await loadGame(currentUser.id);
      if (!active || !savedGame?.game_state) return;

      const game = savedGame.game_state;
      setUsername(game.username || savedGame.username || 'Anonymous');
      const roundedGame = roundGameState(game);
      const loadedRedUpgrades = rebuildRedUpgrades(roundedGame.redUpgrades);
      const loadedActiveUpgradeLevels = roundedGame.activeUpgradeLevels || {};
      const rebuiltActiveState = rebuildActiveUpgradeState(loadedActiveUpgradeLevels);
      const rebuiltCharacters = rebuildPassiveCharacters(roundedGame.ownedCharacters);
      const rebuiltRingsPerSec = rebuiltCharacters.reduce(
        (total, character) => total + character.gain * character.count,
        0,
      );
      const allChaosEmeraldsOwned = loadedRedUpgrades.chaosEmerald.stock === 0;
      const allSuperEmeraldsOwned = loadedRedUpgrades.superEmerald.stock === 0;
      setRings(roundedGame.rings || 0);
      setRedRings(roundedGame.redRings || 0);
      setUpgrade(roundedValue(rebuiltActiveState.upgrade));
      setUpgradeMult(roundedValue(
        1
        + (loadedRedUpgrades.starfall.level || 0)
        + ((loadedRedUpgrades.chipBracelet.level || 0) * 5)
        + ((7 - loadedRedUpgrades.chaosEmerald.stock) * 7)
        + ((loadedRedUpgrades.masterEmerald.stock === 0) ? 50 : 0)
        + ((7 - loadedRedUpgrades.superEmerald.stock) * 25),
      ));
      setBaseMult(roundedGame.baseMult || 1);
      setRebirths(Math.max(0, Math.round(Math.log2(roundedGame.baseMult || 1))));
      setSelectedZone(game.selectedZone || null);
      setRingsPerSec(roundedValue(rebuiltRingsPerSec));
      setRedDrop(getRedDropForLevel(loadedRedUpgrades.speedShoes?.level || 0));
      setRngRed(20 + ((loadedRedUpgrades.robotTeleporter.level || 0) * 5));
      setClickRedRate(loadedRedUpgrades.warpTopaz.level || 0);
      const loadedTimeStones = roundedGame.timeStones || 0;
      setTickSpeed(getTickSpeedForTimeStones(loadedTimeStones));
      setTimeStones(loadedTimeStones);
      setTimePrice(roundedGame.timePrice || 100);
      setSuperMult(allSuperEmeraldsOwned ? 3 : allChaosEmeraldsOwned ? 2 : 1);
      setRedUpgrades(loadedRedUpgrades);
      setOwnedCharacters(rebuiltCharacters);
      setActiveUpgradeCosts(rebuiltActiveState.costs);
      setActiveUpgradeLevels(
        Object.keys(loadedActiveUpgradeLevels).length
          ? loadedActiveUpgradeLevels
          : activeUpgradeLevels,
      );
    }

    initializeAuth().catch((error) => {
      if (active) setSaveStatus(`Connection failed: ${error.message}`);
    });

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        const currentUser = session?.user || null;
        userRef.current = currentUser;
        setUser(currentUser);
      }
    });

    return () => {
      active = false;
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    capsuleVisibleRef.current = capsuleVisible;
  }, [capsuleVisible]);

  useEffect(() => {
    const capsuleTick = setInterval(() => {
      if (rngRed >= Math.random() * 1000 && !capsuleVisibleRef.current) {
        setCapsulePosition({
          left: `${4 + Math.floor(Math.random() * 80)}%`,
          top: `${5 + Math.floor(Math.random() * 80)}%`,
        });
        setCapsuleVisible(true);
        capsuleVisibleRef.current = true;
        capsuleTimeoutRef.current = setTimeout(() => {
          setCapsuleVisible(false);
          capsuleVisibleRef.current = false;
          capsuleTimeoutRef.current = null;
        }, 3000);
      }
    }, tickSpeed);
    return () => {
      clearInterval(capsuleTick);
      if (capsuleTimeoutRef.current) {
        clearTimeout(capsuleTimeoutRef.current);
        capsuleTimeoutRef.current = null;
      }
    };
  }, [rngRed, tickSpeed]);

  useEffect(() => {
    if (!effectiveRingsPerSec) return undefined;
    const passiveTimer = setInterval(() => {
      setRings((value) => value + effectiveRingsPerSec);
    }, tickSpeed);
    return () => clearInterval(passiveTimer);
  }, [effectiveRingsPerSec, tickSpeed]);

  const navigate = (next) => setScreen(next);

  const gameSnapshot = roundGameState({
    username,
    rings,
    redRings,
    upgrade,
    upgradeMult,
    baseMult,
    rebirths,
    selectedZone,
    ringsPerSec,
    redDrop,
    rngRed,
    clickRedRate,
    tickSpeed,
    timeStones,
    timePrice,
    superMult,
    redUpgrades,
    ownedCharacters,
    activeUpgradeCosts,
    activeUpgradeLevels,
    rebirths: baseMult - 1,
  });
  gameSnapshotRef.current = gameSnapshot;

  const handleSave = async () => {
    if (!user) {
      setSaveStatus('Connecting to Supabase...');
      return;
    }

    setSaveStatus('Saving...');
    try {
      await saveGame(user.id, gameSnapshot);
      setSaveStatus('Saved successfully.');
    } catch (error) {
      setSaveStatus(error.message);
    }
  };

  useEffect(() => {
    const autosaveTimer = setInterval(async () => {
      if (!userRef.current || !gameSnapshotRef.current || saveInProgressRef.current) return;

      saveInProgressRef.current = true;
      setSaveStatus('Autosaving...');
      try {
        await saveGame(userRef.current.id, gameSnapshotRef.current);
        setSaveStatus('Autosaved successfully.');
      } catch (error) {
        setSaveStatus(`Autosave failed: ${error.message}`);
      } finally {
        saveInProgressRef.current = false;
      }
    }, 60 * 1000);

    return () => clearInterval(autosaveTimer);
  }, []);

  const showLeaderboard = async () => {
    setScreen('leaderboard');
    setLeaderboardLoading(true);
    setLeaderboardError('');
    try {
      setLeaderboardRows(await loadLeaderboard());
    } catch (error) {
      setLeaderboardError(error.message);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  const collectRedRings = () => {
    if (clickRedRate * backgroundMultipliers.redRate < Math.floor(Math.random() * 1000)) return;
    setRedRings((value) => roundedValue(value + effectiveRedRingDrop));
  };

  const collectRings = () => {
    setRings((value) => Math.round(value + ringsPerClick));
    collectRedRings();
  };

  const collectCapsule = () => {
    setRedRings((value) => roundedValue(value + effectiveRedRingDrop));
    setCapsuleVisible(false);
    capsuleVisibleRef.current = false;
    if (capsuleTimeoutRef.current) {
      clearTimeout(capsuleTimeoutRef.current);
      capsuleTimeoutRef.current = null;
    }
  };

  const purchaseCharacter = (character) => {
    if (rings < character.cost) return;
    setRings((value) => value - character.cost);
    setRingsPerSec((value) => value + character.gain);
    setOwnedCharacters((current) => current.map((owned) => (
      owned.name === character.name ? { ...owned, count: owned.count + 1, cost: roundedValue(owned.cost * 1.2) } : owned
    )));
  };
  const purchaseActiveUpgrade = (upgrade) => {
    const cost = activeUpgradeCosts[upgrade.name];
    if (rings < cost) return;
    setRings((value) => value - cost);
    setUpgrade((value) => value + upgrade.gain);
    setActiveUpgradeLevels((current) => ({
      ...current,
      [upgrade.name]: (current[upgrade.name] || 0) + 1,
    }));
    setActiveUpgradeCosts((current) => ({
      ...current,
      [upgrade.name]: roundedValue(current[upgrade.name] * 1.2),
    }));
  };
  const purchaseTimeStone = () => {
    if (timeStones >= 7) {
      setBaseMult((value) => value * 2);
      setRebirths((value) => value + 1);
      setRings(0);
      setRedRings(0);
      setUpgrade(0);
      setUpgradeMult(1);
      setRingsPerSec(0);
      setRngRed(20);
      setRedDrop(2);
      setClickRedRate(0);
      setSuperMult(1);
      setTickSpeed(1000);
      setTimeStones(0);
      setTimePrice(roundedValue(100 * baseMult * 2));
      setRedUpgrades(createRedUpgrades());
      setOwnedCharacters(passiveCharacters.map((character) => ({ ...character, count: 0 })));
      setActiveUpgradeCosts(Object.fromEntries(activeUpgrades.map((upgrade) => [upgrade.name, upgrade.cost])));
      setActiveUpgradeLevels(Object.fromEntries(activeUpgrades.map((upgrade) => [upgrade.name, 0])));
      return;
    }
    if (rings < timePrice) return;
    setRings((value) => Math.round(value - timePrice));
    const nextTimeStones = timeStones + 1;
    setTickSpeed(getTickSpeedForTimeStones(nextTimeStones));
    setTimeStones(nextTimeStones);
    setTimePrice((value) => roundedValue(value * 35));
  };
  const purchaseRedUpgrade = (item) => {
    const upgrade = redUpgrades[item.key];
    if (redRings < upgrade.price || upgrade.stock === 0) return;
    const allChaosEmeraldsOwned = redUpgrades.chaosEmerald.stock === 0;
    const masterEmeraldOwned = redUpgrades.masterEmerald.stock === 0;
    if (item.key === 'superEmerald' && (!allChaosEmeraldsOwned || !masterEmeraldOwned)) return;
    const priceMultiplier = ['warpTopaz', 'robotTeleporter'].includes(item.key) ? 1.8 : 1.5;
    setRedUpgrades((current) => ({
      ...current,
      [item.key]: {
        ...current[item.key],
        price: roundedValue(current[item.key].price * priceMultiplier),
        level: (current[item.key].level || 0) + 1,
        stock: typeof current[item.key].stock === 'number' ? current[item.key].stock - 1 : current[item.key].stock,
      },
    }));
    setRedRings((value) => roundedValue(value - upgrade.price));
    if (item.key === 'speedShoes') {
      setRedDrop(getRedDropForLevel((upgrade.level || 0) + 1));
    }
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
          redRingDrop={effectiveRedRingDrop}
          redRingClickRate={clickRedRate * backgroundMultipliers.redRate}
          capsuleSpawnRate={rngRed}
          rebirths={rebirths}
          superMult={superMult}
          currentZone={selectedZone}
          chaosEmeraldsOwned={7 - redUpgrades.chaosEmerald.stock}
          superEmeraldsOwned={7 - redUpgrades.superEmerald.stock}
          ringsPerClick={ringsPerClick}
          ringsPerSec={effectiveRingsPerSec}
          timeStones={timeStones}
          timePrice={timePrice}
          passiveCharacters={ownedCharacters}
          backgroundSource={backgroundSource}
          capsuleVisible={capsuleVisible}
          capsulePosition={capsulePosition}
          onRing={collectRings}
          onCapsule={collectCapsule}
          onTimeStone={purchaseTimeStone}
          navigate={navigate}
        />
      );
    }

    if (screen === 'levels') {
      return (
        <LevelsScreen
          navigate={navigate}
          rebirths={rebirths}
          selectedZone={selectedZone}
          onSelectZone={(zone) => {
            const level = levels.find((candidate) => candidate.name === zone);
            if (level && rebirths < level.requiredRebirths) return;
            setSelectedZone(zone);
            navigate('home');
          }}
        />
      );
    }
    if (screen === 'stats') {
      return (
        <StatsScreen
          rings={rings}
          redRings={redRings}
          upgrade={upgrade}
          ringsPerClick={ringsPerClick}
          ringsPerSec={effectiveRingsPerSec}
          redPerEvent={effectiveRedRingDrop}
          redDrop={redDrop}
          redChance={clickRedRate * backgroundMultipliers.redRate}
          capsuleChance={rngRed}
          upgradeMult={upgradeMult}
          baseMult={baseMult}
          superMult={superMult}
          tickSpeed={tickSpeed}
          timeStones={timeStones}
          timePrice={timePrice}
          rebirths={rebirths}
          selectedZone={selectedZone}
          chaosEmeraldsOwned={7 - redUpgrades.chaosEmerald.stock}
          superEmeraldsOwned={7 - redUpgrades.superEmerald.stock}
          masterEmeraldOwned={redUpgrades.masterEmerald.stock === 0}
          username={username}
          setUsername={setUsername}
          onSave={handleSave}
          saveStatus={saveStatus}
          onLeaderboard={showLeaderboard}
          navigate={navigate}
        />
      );
    }
    if (screen === 'leaderboard') {
      return (
        <Leaderboard
          rows={leaderboardRows}
          loading={leaderboardLoading}
          error={leaderboardError}
          navigate={navigate}
        />
      );
    }

    return (
      <MarketScreen
        navigate={navigate}
        page={screen}
        rings={rings}
        redRings={redRings}
        passiveCharacters={ownedCharacters}
        activeUpgradeLevels={activeUpgradeLevels}
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
  zoneScreen: { backgroundColor: '#0d245f', alignItems: 'stretch' },
  zoneScroll: { flex: 1, width: '100%' },
  zoneContent: { alignItems: 'center', padding: 8, paddingBottom: 24 },
  zoneHeader: { width: '100%', backgroundColor: 'rgba(20, 43, 104, .98)', borderWidth: 1, borderColor: '#7de2ff', borderRadius: 10, padding: 12, marginBottom: 10 },
  zoneTitle: { color: '#ffe75c', fontSize: 22, fontWeight: '900', textAlign: 'center' },
  zoneSubtitle: { color: '#d9e3ff', fontSize: 13, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  zoneProgressRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  zoneProgressCard: { width: '48.5%', backgroundColor: 'rgba(5, 28, 91, .8)', borderRadius: 7, padding: 8, alignItems: 'center' },
  zoneProgressLabel: { color: '#9eb6e8', fontSize: 10, fontWeight: '900' },
  zoneProgressValue: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 3, textAlign: 'center' },
  greenHillOption: { width: '100%', backgroundColor: 'rgba(37, 127, 91, .9)', borderWidth: 1, borderColor: '#79e0ad', borderRadius: 9, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  selectedZoneCard: { borderWidth: 2, borderColor: '#ffe75c' },
  zoneCardTitle: { color: '#fff', fontSize: 18, fontWeight: '900' },
  zoneCardDescription: { color: '#d9ffe9', fontSize: 12, marginTop: 2 },
  zoneStatus: { color: '#ffe75c', fontSize: 12, fontWeight: '900' },
  zoneListTitle: { width: '100%', color: '#7de2ff', fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
  topBar: { width: '100%', minHeight: 55, backgroundColor: 'rgba(5, 28, 91, .94)', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8 },
  topTitle: { color: '#fff', fontSize: 24, fontWeight: '900' },
  backArrow: { width: 38 },
  backArrowText: { color: '#fff', fontSize: 38, lineHeight: 38 },
  topBarSpacer: { width: 38 },
  clickerContent: { width: '100%', flex: 1, alignItems: 'center', paddingBottom: 15 },
  clickStats: { width: '100%', backgroundColor: 'rgba(13, 36, 116, .9)', borderRadius: 6, padding: 6, marginBottom: 3 },
  statsTitle: { color: '#ffe75c', fontSize: 12, fontWeight: '900', textAlign: 'center', marginBottom: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statCard: { width: '32%', minHeight: 43, backgroundColor: 'rgba(255, 255, 255, .16)', borderRadius: 4, padding: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 3 },
  redStatCard: { backgroundColor: 'rgba(255, 64, 81, .3)' },
  statCardLabel: { color: '#fff', fontSize: 8, fontWeight: '900', textAlign: 'center' },
  statCardValue: { color: '#ffe75c', fontSize: 15, fontWeight: '900', marginTop: 1 },
  goalStage: { width: '100%', height: 340, position: 'relative', alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  goalButton: { width: 200, height: 200, borderRadius: 75, alignItems: 'center', justifyContent: 'center' },
  goalPressed: { transform: [{ scale: 0.94 }] },
  goalImage: { width: 200, height: 200, resizeMode: 'contain' },
  emeraldRow: { position: 'absolute', bottom: 8, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  emeraldImage: { width: 30, height: 30, resizeMode: 'contain', marginHorizontal: 8 },
  superEmeraldBoosted: { transform: [{ scale: 1.5 }] },
  characterBadge: { position: 'absolute', width: 70, alignItems: 'center', zIndex: 2 },
  characterTopLeft: { top: 0, left: '50%', transform: [{ translateX: -135 }, { translateY: 20 }] },
  characterTopRight: { top: 0, left: '50%', transform: [{ translateX: 55 }, { translateY: 20 }] },
  characterLeft: { top: 50, left: '50%', transform: [{ translateX: -195 }, { translateY: 30 }] },
  characterRight: { top: 50, left: '50%', transform: [{ translateX: 120 }, { translateY: 30 }] },
  characterTop: { top: -20, left: '50%', transform: [{ translateX: -35 }, { translateY: 20 }] },
  characterIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff' },
  characterInitial: { color: '#fff', fontSize: 22, fontWeight: '900' },
  characterCount: { color: '#fff', backgroundColor: 'navy', borderRadius: 8, paddingHorizontal: 5, fontSize: 12, fontWeight: '900', marginTop: -7 },
  characterName: { color: '#000', fontSize: 10, fontWeight: '900', textAlign: 'center', marginTop: 2 },
  collectibleGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', backgroundColor: 'rgba(205, 215, 227, .68)' },
  collectible: { width: '50%', height: 110, borderWidth: 1, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  collectibleImage: { width: 70, height: 70, resizeMode: 'contain' },
  collectibleCount: { position: 'absolute', right: 12, bottom: 8, color: '#fff', fontSize: 18, fontWeight: '900' },
  placeholder: { width: '100%', height: '100%', backgroundColor: '#d8e0e8', overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
  placeholderSun: { position: 'absolute', width: 22, height: 22, borderRadius: 11, backgroundColor: '#e8b848', top: 16, right: 20 },
  placeholderHill: { width: '130%', height: 45, backgroundColor: '#95a9b5', transform: [{ rotate: '-13deg' }], marginBottom: 25 },
  placeholderText: { position: 'absolute', bottom: 8, color: '#687989', fontSize: 11, fontWeight: '900', backgroundColor: 'rgba(255,255,255,.75)', paddingHorizontal: 5 },
  capsule: { position: 'absolute', width: 70, height: 80, backgroundColor: '#20283e', borderWidth: 2, borderColor: '#ef3340', borderRadius: 10, padding: 4, alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  capsuleImage: { width: 52, height: 44, resizeMode: 'contain' },
  capsuleText: { width: '100%', color: '#fff', fontWeight: '900', fontSize: 9, textAlign: 'center', marginTop: 2 },
  rebirthInfo: { width: '96%', backgroundColor: 'rgba(5, 28, 91, .9)', borderWidth: 1, borderColor: '#ffe75c', borderRadius: 6, padding: 8, marginVertical: 5 },
  rebirthInfoTitle: { color: '#ffe75c', fontSize: 13, fontWeight: '900', textAlign: 'center' },
  rebirthInfoText: { color: '#fff', fontSize: 12, lineHeight: 16, textAlign: 'center', marginTop: 3 },
  rebirthInfoProgress: { color: '#ff5964', fontSize: 12, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  formZoneRow: { width: '96%', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  formInfo: { width: '49%', minHeight: 66, backgroundColor: 'rgba(20, 43, 104, .94)', borderWidth: 1, borderColor: '#7de2ff', borderRadius: 6, padding: 7, alignItems: 'center', justifyContent: 'center' },
  formInfoLabel: { color: '#d9e3ff', fontSize: 10, fontWeight: '900' },
  formDisplay: { color: '#7de2ff', fontSize: 16, fontWeight: '900', marginTop: 2 },
  formMultiplier: { color: '#ffe75c', fontSize: 12, fontWeight: '900', marginTop: 1 },
  mainButtons: { width: '100%', marginTop: 'auto', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', paddingTop: 4 },
  button: {
    backgroundColor: '#ffb703',
    borderColor: '#d88700',
    borderWidth: 1,
    borderRadius: 12,
    minWidth: 112,
    minHeight: 46,
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    shadowColor: '#06143d',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  wideButton: { minWidth: 150 },
  disabledButton: { backgroundColor: '#687386', borderColor: '#4d586b', shadowOpacity: 0, elevation: 0 },
  buttonText: { color: '#071d5a', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  buttonPressed: { opacity: 0.82, transform: [{ translateY: 2 }], shadowOpacity: 0.12, elevation: 1 },
  pressed: { opacity: 0.65 },
  pageTitle: { color: '#4a5360', fontSize: 31, fontWeight: '900', textAlign: 'center', marginVertical: 8 },
  levelGrid: { width: '100%', flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  level: { width: '48.5%', backgroundColor: 'rgba(20, 43, 104, .96)', borderWidth: 1, borderColor: '#4d79bd', borderRadius: 9, padding: 7, marginBottom: 10 },
  lockedLevel: { opacity: 0.62 },
  levelImage: { width: '100%', height: 120, resizeMode: 'cover', borderRadius: 6 },
  levelInfo: { alignItems: 'center', paddingTop: 6 },
  levelName: { color: '#fff', fontSize: 16, fontWeight: '900', textAlign: 'center' },
  levelBonus: { color: '#ffe75c', fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: 2 },
  levelRequirement: { color: '#b9c9ed', fontSize: 11, fontWeight: '800', textAlign: 'center', marginVertical: 4 },
  marketScreen: { backgroundColor: '#241a36', alignItems: 'stretch' },
  ringShopScreen: { backgroundColor: '#7d2638', alignItems: 'stretch' },
  marketArtwork: { width: '100%', height: 245, borderRadius: 10, overflow: 'hidden', borderWidth: 1, borderColor: '#d94b57' },
  ringShopHeader: { width: '100%', backgroundColor: 'rgba(5, 28, 91, .96)', borderBottomWidth: 2, borderColor: '#ffb703', borderRadius: 8, padding: 14, marginBottom: 4 },
  ringShopTitle: { color: '#ffe75c', fontSize: 28, fontWeight: '900' },
  ringShopSubtitle: { color: '#e5edff', fontSize: 14, fontWeight: '700', marginTop: 4 },
  ringShopBalance: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 8 },
  marketBackground: { opacity: 0.9 },
  marketHeader: { backgroundColor: 'rgba(27, 16, 54, .96)', borderBottomWidth: 2, borderColor: '#ff5964', paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  marketLogo: { color: '#ffe75c', fontSize: 22, fontWeight: '900' },
  marketJapanese: { color: '#f4d8df', fontSize: 14, fontWeight: '900' },
  marketWelcomeRow: { flexDirection: 'row', alignItems: 'stretch', justifyContent: 'flex-end', marginTop: 155 },
  marketWelcome: { flex: 1, backgroundColor: '#b83440', padding: 10 },
  marketRedBalance: { width: '28%', height: 40, backgroundColor: 'rgba(156, 53, 53, 0.96)', borderWidth: 1, borderColor: '#ff5964', borderRadius: 8, padding: 0, alignSelf: 'flex-end', marginTop: 153, marginRight: 8, alignItems: 'center', justifyContent: 'center' },
  marketRedLabel: { color: '#fff', fontSize: 10, marginTop: 3 },
  marketRedCount: { color: '#ffffff', fontSize: 16, fontWeight: '900', marginTop: 0 },
  marketBody: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around', marginTop: 10 },
  shopScroll: { width: '100%', flex: 1 },
  ringShopColumns: { width: '100%', flexDirection: 'row', justifyContent: 'space-between' },
  upgradeColumn: { width: '49%', alignItems: 'center' },
  columnShopItem: { width: '100%' },
  shopColumnTitle: { width: '100%', color: '#ffe75c', backgroundColor: '#142b68', borderWidth: 1, borderColor: '#5d7bc4', borderRadius: 6, fontSize: 18, fontWeight: '900', textAlign: 'center', paddingVertical: 7, marginBottom: 6 },
  shopItem: { width: '46%', backgroundColor: 'rgba(27, 16, 54, .72)', borderWidth: 1, borderColor: '#6f3a5b', borderRadius: 8, alignItems: 'center', padding: 8, marginBottom: 8 },
  shopCharacterIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff', marginBottom: 3 },
  shopName: { color: '#fff', fontSize: 15, fontWeight: '900', textAlign: 'center' },
  shopDetail: { color: '#fff', fontSize: 14, fontWeight: '900', textAlign: 'center', minHeight: 34 },
  shopLevel: { color: '#ffe75c', fontSize: 13, fontWeight: '900', textAlign: 'center', marginBottom: 2 },
  shopStock: { color: '#fff', fontSize: 14, fontWeight: '900', textAlign: 'center' },
  statsScreen: { backgroundColor: '#101b3d', alignItems: 'stretch' },
  statsScroll: { width: '100%', flex: 1 },
  statsContent: { alignItems: 'center', flexGrow: 1, padding: 8, paddingBottom: 24 },
  statsIntro: { color: '#d9e3ff', fontSize: 14, fontWeight: '700', marginVertical: 8 },
  statsGroup: { width: '100%', backgroundColor: 'rgba(5, 28, 91, .94)', borderRadius: 10, padding: 8, marginBottom: 10, borderWidth: 1, borderColor: '#385a9d' },
  statsGroupTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
  statsAccentGold: { color: '#ffe75c' },
  statsAccentBlue: { color: '#7de2ff' },
  statsAccentRed: { color: '#ff8b95' },
  statsAccentPurple: { color: '#d7a8ff' },
  statsCardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statsTile: { width: '48.5%', minHeight: 58, backgroundColor: 'rgba(255, 255, 255, .1)', borderRadius: 7, padding: 7, marginBottom: 6, justifyContent: 'center' },
  statsTileLabel: { color: '#b9c9ed', fontSize: 10, fontWeight: '800' },
  statsTileValue: { color: '#fff', fontSize: 17, fontWeight: '900', marginTop: 4 },
  savePanel: { width: '100%', backgroundColor: 'rgba(20, 43, 104, .98)', borderWidth: 1, borderColor: '#ffe75c', borderRadius: 10, padding: 10, alignItems: 'center', marginTop: 2 },
  saveTitle: { color: '#ffe75c', fontSize: 16, fontWeight: '900', marginBottom: 7 },
  username: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#9aa7c2', borderRadius: 7, padding: 11, color: '#33445b', width: '100%', marginBottom: 4 },
  saveStatus: { color: '#d9e3ff', fontSize: 13, fontWeight: '900', textAlign: 'center', marginTop: 4 },
  statsActions: { width: '100%', flexDirection: 'row', justifyContent: 'space-around', marginTop: 6 },
  table: { flex: 1, width: '100%', borderWidth: 1, borderColor: '#fff', backgroundColor: 'rgba(210, 221, 235, .62)' },
  tableHeader: { color: '#4a5360', fontSize: 16, fontWeight: '900', padding: 8, textAlign: 'center' },
  leaderboardRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderColor: '#fff', padding: 8 },
  leaderboardCell: { color: '#33445b', flex: 1, fontSize: 15, fontWeight: '900', textAlign: 'center' },
});
