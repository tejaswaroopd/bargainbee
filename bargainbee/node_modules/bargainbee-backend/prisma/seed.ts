import { PrismaClient, Role, Category, ListingStatus, EscrowStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding BargainBee database...');

  // Platform config
  await prisma.platformConfig.upsert({
    where: { key: 'COMMISSION_PERCENT' },
    update: {},
    create: { key: 'COMMISSION_PERCENT', value: '5' },
  });
  await prisma.platformConfig.upsert({
    where: { key: 'PRIORITY_VERIFICATION_FEE' },
    update: {},
    create: { key: 'PRIORITY_VERIFICATION_FEE', value: '99' },
  });
  await prisma.platformConfig.upsert({
    where: { key: 'AUTO_RELEASE_DAYS' },
    update: {},
    create: { key: 'AUTO_RELEASE_DAYS', value: '7' },
  });

  // Seed users
  const passwordHash = await bcrypt.hash('Demo1234!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@bargainbee.in' },
    update: {},
    create: {
      email: 'admin@bargainbee.in',
      name: 'Admin Bee',
      role: Role.ADMIN,
      passwordHash,
      isVerified: true,
      repScore: 5.0,
      referralCode: 'ADMIN001',
    },
  });

  const seller = await prisma.user.upsert({
    where: { email: 'seller1@demo.com' },
    update: {},
    create: {
      email: 'seller1@demo.com',
      name: 'Priya Sharma',
      role: Role.SELLER,
      passwordHash,
      isVerified: true,
      repScore: 4.8,
      totalSales: 12,
      referralCode: 'PRIYA001',
    },
  });

  const seller2 = await prisma.user.upsert({
    where: { email: 'seller2@demo.com' },
    update: {},
    create: {
      email: 'seller2@demo.com',
      name: 'Rahul Mehta',
      role: Role.BOTH,
      passwordHash,
      isVerified: true,
      repScore: 4.5,
      totalSales: 7,
      referralCode: 'RAHUL001',
    },
  });

  const buyer = await prisma.user.upsert({
    where: { email: 'buyer1@demo.com' },
    update: {},
    create: {
      email: 'buyer1@demo.com',
      name: 'Arjun Patel',
      role: Role.BUYER,
      passwordHash,
      isVerified: true,
      repScore: 5.0,
      totalPurchases: 5,
      referralCode: 'ARJUN001',
    },
  });

  // Seed listings
  const listings = [
    // Fashion
    {
      sellerId: seller.id,
      brand: 'Myntra',
      category: Category.FASHION,
      faceValue: 2000,
      askingPrice: 1600,
      discountPct: 20,
      expiryDate: new Date('2026-10-30'),
      description: 'Myntra gift voucher, valid on all fashion items. Received as corporate gift, transferable.',
      voucherCode: 'MYN-9842-5512-BEE9',
      status: ListingStatus.LIVE,
      isFeatured: true,
      tags: ['myntra', 'fashion', 'clothing'],
    },
    {
      sellerId: seller2.id,
      brand: 'Ajio',
      category: Category.FASHION,
      faceValue: 1500,
      askingPrice: 1275,
      discountPct: 15,
      expiryDate: new Date('2026-11-15'),
      description: 'Ajio brand voucher. Valid across all collections on Ajio website and mobile app.',
      voucherCode: 'AJIO-4812-9901-XZTR',
      status: ListingStatus.LIVE,
      tags: ['ajio', 'fashion'],
    },
    {
      sellerId: seller.id,
      brand: 'Zara',
      category: Category.FASHION,
      faceValue: 5000,
      askingPrice: 3750,
      discountPct: 25,
      expiryDate: new Date('2026-09-25'),
      description: 'Zara gift card. Expiring soon - grab a great deal on high-end retail fashion!',
      voucherCode: 'ZARA-8812-3341-9921',
      status: ListingStatus.LIVE,
      isFeatured: true,
      tags: ['zara', 'fashion', 'premium'],
    },
    // Electronics
    {
      sellerId: seller2.id,
      brand: 'Croma',
      category: Category.ELECTRONICS,
      faceValue: 10000,
      askingPrice: 8500,
      discountPct: 15,
      expiryDate: new Date('2026-12-31'),
      description: 'Croma gift voucher, usable both in-store and online across India.',
      voucherCode: 'CROMA-7711-2299-4455',
      status: ListingStatus.LIVE,
      tags: ['croma', 'electronics', 'gadgets'],
    },
    {
      sellerId: seller.id,
      brand: 'Samsung',
      category: Category.ELECTRONICS,
      faceValue: 5000,
      askingPrice: 4000,
      discountPct: 20,
      expiryDate: new Date('2026-10-15'),
      description: 'Samsung Smart Store voucher. Redeem for phones, tablets, earbuds, and accessories.',
      voucherCode: 'SAM-3321-7788-0012',
      status: ListingStatus.LIVE,
      tags: ['samsung', 'electronics'],
    },
    {
      sellerId: seller2.id,
      brand: 'Apple',
      category: Category.ELECTRONICS,
      faceValue: 3000,
      askingPrice: 2700,
      discountPct: 10,
      expiryDate: new Date('2027-01-31'),
      description: 'Apple App Store & iTunes gift card. Redeemable for digital subscriptions and apps.',
      voucherCode: 'APPL-9922-3311-6644',
      status: ListingStatus.PENDING,
      isPriorityVerification: true,
      tags: ['apple', 'app store', 'ios'],
    },
    // Food & Dining
    {
      sellerId: seller.id,
      brand: 'Swiggy',
      category: Category.FOOD_DINING,
      faceValue: 500,
      askingPrice: 400,
      discountPct: 20,
      expiryDate: new Date('2026-09-30'),
      description: 'Swiggy Money gift voucher credit. Works instantly across all food and grocery orders.',
      voucherCode: 'SWIG-6655-4433-2211',
      status: ListingStatus.LIVE,
      tags: ['swiggy', 'food', 'delivery'],
    },
    {
      sellerId: seller2.id,
      brand: 'Zomato',
      category: Category.FOOD_DINING,
      faceValue: 1000,
      askingPrice: 800,
      discountPct: 20,
      expiryDate: new Date('2026-11-30'),
      description: 'Zomato gift card redeemable for dining out or home delivery via Zomato app.',
      voucherCode: 'ZOMT-1122-3344-5566',
      status: ListingStatus.LIVE,
      isFeatured: true,
      tags: ['zomato', 'food', 'dining'],
    },
    {
      sellerId: seller.id,
      brand: 'Starbucks',
      category: Category.FOOD_DINING,
      faceValue: 2000,
      askingPrice: 1700,
      discountPct: 15,
      expiryDate: new Date('2026-12-15'),
      description: 'Starbucks e-Gift Card. Enjoy handcrafted coffees, food, and merchandise at any Starbucks India cafe.',
      voucherCode: 'SBUX-9988-7766-5544',
      status: ListingStatus.LIVE,
      tags: ['starbucks', 'coffee', 'cafe'],
    },
    // Lifestyle
    {
      sellerId: seller2.id,
      brand: 'BookMyShow',
      category: Category.LIFESTYLE,
      faceValue: 1000,
      askingPrice: 850,
      discountPct: 15,
      expiryDate: new Date('2026-10-31'),
      description: 'BookMyShow voucher. Instant booking for movies, concerts, theater, and sporting events.',
      voucherCode: 'BMS-5544-3322-1100',
      status: ListingStatus.LIVE,
      tags: ['bookmyshow', 'movies', 'entertainment'],
    },
    {
      sellerId: seller.id,
      brand: 'Nykaa',
      category: Category.LIFESTYLE,
      faceValue: 2500,
      askingPrice: 2000,
      discountPct: 20,
      expiryDate: new Date('2026-11-20'),
      description: 'Nykaa luxury beauty voucher. Valid on all skincare, cosmetics, and wellness products.',
      voucherCode: 'NYK-8877-6655-4433',
      status: ListingStatus.LIVE,
      tags: ['nykaa', 'beauty', 'skincare'],
    },
    {
      sellerId: seller2.id,
      brand: 'Cultfit',
      category: Category.LIFESTYLE,
      faceValue: 3000,
      askingPrice: 2250,
      discountPct: 25,
      expiryDate: new Date('2026-10-10'),
      description: 'Cult.fit fitness pass voucher. Access gym passes, online classes, and physical centers nationwide.',
      voucherCode: 'CULT-1234-5678-9012',
      status: ListingStatus.PENDING,
      tags: ['cultfit', 'fitness', 'gym'],
    },
  ];

  const createdListings = [];
  for (const listing of listings) {
    const created = await prisma.voucherListing.create({ data: listing });
    createdListings.push(created);
  }

  // Mark LIVE listings as verified
  await prisma.voucherListing.updateMany({
    where: { status: ListingStatus.LIVE },
    data: {
      verifiedAt: new Date(),
      verifiedBy: admin.id,
    },
  });

  // Seed orders (completed escrow transactions)
  const order1 = await prisma.order.create({
    data: {
      listingId: createdListings[0].id,
      buyerId: buyer.id,
      sellerId: seller.id,
      amount: 1600,
      commission: 80,
      sellerEarnings: 1520,
      escrowStatus: EscrowStatus.RELEASED,
      razorpayOrderId: 'order_demo_myntra_101',
      razorpayPaymentId: 'pay_demo_myntra_101',
      paymentCapturedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.order.create({
    data: {
      listingId: createdListings[7].id,
      buyerId: buyer.id,
      sellerId: seller2.id,
      amount: 800,
      commission: 40,
      sellerEarnings: 760,
      escrowStatus: EscrowStatus.RELEASED,
      razorpayOrderId: 'order_demo_zomato_102',
      razorpayPaymentId: 'pay_demo_zomato_102',
      paymentCapturedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      confirmedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    },
  });

  // Seed review
  await prisma.review.create({
    data: {
      orderId: order1.id,
      reviewerId: buyer.id,
      revieweeId: seller.id,
      rating: 5,
      comment: 'Super fast voucher code delivery! Verified and redeemed on Myntra within 5 minutes. 🐝',
    },
  });

  // Update seller stats
  await prisma.user.update({
    where: { id: seller.id },
    data: { totalSales: { increment: 1 } },
  });
  await prisma.user.update({
    where: { id: buyer.id },
    data: { totalPurchases: { increment: 2 } },
  });

  // Seed wishlist
  await prisma.wishlist.create({
    data: {
      userId: buyer.id,
      brand: 'Myntra',
      category: Category.FASHION,
      maxPrice: 2000,
      notifyEmail: true,
    },
  });

  console.log('✅ Seeding complete!');
  console.log('📧 Demo accounts:');
  console.log('   Admin:  admin@bargainbee.in  / Demo1234!');
  console.log('   Seller: seller1@demo.com     / Demo1234!');
  console.log('   Seller: seller2@demo.com     / Demo1234!');
  console.log('   Buyer:  buyer1@demo.com      / Demo1234!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
