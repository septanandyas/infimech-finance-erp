-- phpMyAdmin SQL Dump
-- version 5.2.2
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Jul 08, 2026 at 06:07 AM
-- Server version: 11.8.8-MariaDB-log
-- PHP Version: 7.2.34

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `u533684840_erpinfimech`
--

-- --------------------------------------------------------

--
-- Table structure for table `assets`
--

CREATE TABLE `assets` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `file_type` enum('PDF','Image','Template','Video') NOT NULL DEFAULT 'Image',
  `tags` varchar(255) DEFAULT NULL,
  `file_url` longtext DEFAULT NULL,
  `download_count` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `category` varchar(100) NOT NULL DEFAULT 'Brosur',
  `version` varchar(50) NOT NULL DEFAULT '1.0',
  `sharing_status` varchar(50) NOT NULL DEFAULT 'Private',
  `size` varchar(50) NOT NULL DEFAULT '2.4 MB',
  `version_history` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `assets`
--

INSERT INTO `assets` (`id`, `name`, `file_type`, `tags`, `file_url`, `download_count`, `created_by`, `created_at`, `updated_at`, `category`, `version`, `sharing_status`, `size`, `version_history`) VALUES
(1, 'Brosur Jasa Simulasi CFD (Fluids)', 'PDF', 'brosur, cfd, fluids, sales', '/assets/files/brosur_cfd.pdf', 86, 2, '2026-07-06 04:48:11', '2026-07-07 01:24:12', 'CFD/FEA', 'Versi 1.3', 'Shared', '4.2 MB', NULL),
(2, 'Brosur Analisis Struktur FEA (Solid)', 'PDF', 'fea, struktur, solid, sales', '/assets/files/brosur_fea.pdf', 72, 2, '2026-07-06 04:48:11', '2026-07-06 07:34:34', 'CFD/FEA', 'v1.1', 'Shared', '3.8 MB', NULL),
(3, 'Case Study: Optimasi Turbin Angin B2B', 'PDF', 'case study, turbine, wind', '/assets/files/cs_turbine.pdf', 124, 2, '2026-07-06 04:48:11', '2026-07-06 07:36:56', 'Case Study', '2.1', 'Shared', '5.1 MB', NULL),
(4, 'Case Study: Thermal Comfort Gedung Hijau', 'PDF', 'case study, hvac, green building', '/assets/files/cs_hvac.pdf', 96, 2, '2026-07-06 04:48:11', '2026-07-06 04:48:11', 'Case Study', '1.1', 'Shared', '6.2 MB', NULL),
(5, 'Template Proposal Jasa Konsultasi CAE', 'Template', 'proposal, template, docx', '/assets/files/proposal_template_cae.docx', 231, 2, '2026-07-06 04:48:11', '2026-07-06 07:35:14', 'Proposal Template', '3.4', 'Shared', '1.8 MB', NULL),
(6, 'Galeri Foto Hasil Render CFD Aerodinamika', 'Image', 'foto, render, cfd, aerodinamika', '/assets/images/cfd_aero.png', 342, 2, '2026-07-06 04:48:11', '2026-07-06 04:48:11', 'Foto Proyek', '1.0', 'Shared', '12.4 MB', NULL),
(7, 'Whitepaper: Peran CAE pada Industri Manufaktur', 'PDF', 'whitepaper, cae, manufaktur', '/assets/files/whitepaper_cae.pdf', 145, 2, '2026-07-06 04:48:11', '2026-07-06 04:48:11', 'Whitepaper', '1.0', 'Shared', '2.9 MB', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `budgets`
--

CREATE TABLE `budgets` (
  `id` int(11) NOT NULL,
  `campaign_id` int(11) NOT NULL,
  `total_budget` decimal(15,2) NOT NULL,
  `spent_amount` decimal(15,2) DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `campaigns`
--

CREATE TABLE `campaigns` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `channel` varchar(100) NOT NULL,
  `budget` decimal(15,2) NOT NULL DEFAULT 0.00,
  `spend` decimal(15,2) NOT NULL DEFAULT 0.00,
  `conversion` int(11) NOT NULL DEFAULT 0,
  `revenue` decimal(15,2) NOT NULL DEFAULT 0.00,
  `status` enum('Active','Completed','Paused','Planned') NOT NULL DEFAULT 'Planned',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `campaigns`
--

INSERT INTO `campaigns` (`id`, `name`, `channel`, `budget`, `spend`, `conversion`, `revenue`, `status`, `start_date`, `end_date`, `created_at`, `updated_at`) VALUES
(1, 'Ramadhan Big Sale Promo', 'Instagram Ads', 50000000.00, 42000000.00, 480, 180000000.00, 'Active', '2026-03-01', '2026-04-15', '2026-07-07 01:11:13', '2026-07-07 01:11:13'),
(2, 'B2B Enterprise Lead Gen', 'LinkedIn Ads', 80000000.00, 75000000.00, 120, 320000000.00, 'Completed', '2026-01-10', '2026-02-28', '2026-07-07 01:11:13', '2026-07-07 01:11:13'),
(3, 'TikTok Shop Product Launch', 'TikTok Ads', 30000000.00, 12000000.00, 950, 45000000.00, 'Active', '2026-06-01', '2026-07-31', '2026-07-07 01:11:13', '2026-07-07 01:11:13'),
(4, 'Google Search - High Intent CRM', 'Google Ads', 60000000.00, 15000000.00, 210, 150000000.00, 'Active', '2026-05-15', '2026-08-15', '2026-07-07 01:11:13', '2026-07-07 01:11:13');

-- --------------------------------------------------------

--
-- Table structure for table `Cashflow`
--

CREATE TABLE `Cashflow` (
  `id` int(11) NOT NULL,
  `type` enum('income','expense') NOT NULL,
  `category` varchar(100) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `description` text DEFAULT NULL,
  `date` date NOT NULL,
  `projectId` varchar(50) DEFAULT NULL,
  `createdBy` int(11) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Cashflow`
--

INSERT INTO `Cashflow` (`id`, `type`, `category`, `amount`, `description`, `date`, `projectId`, `createdBy`, `createdAt`, `updatedAt`) VALUES
(1, 'income', 'Down Payment', 200000000.00, 'Coba saja', '2026-06-25', '21.IMX.2026-X-021', 2, '2026-06-25 06:07:24', '2026-06-25 06:07:24'),
(2, 'expense', 'Gaji', 10000000.00, 'Nyoba', '2026-06-25', NULL, 2, '2026-06-25 06:08:04', '2026-06-25 06:08:04'),
(5, 'income', 'Pembayaran Project', 1500000.00, 'Pembayaran Termin', '2026-05-19', 'IMX.2026-X-013', 2, '2026-06-25 06:58:22', '2026-06-25 06:58:22'),
(6, 'expense', 'Lain-lain', 380000.00, 'Pembayaran Vendor 3D Laser Scan', '2026-07-14', 'IMX.2026-X-012', 2, '2026-06-25 06:59:22', '2026-07-06 00:30:26');

-- --------------------------------------------------------

--
-- Table structure for table `Client`
--

CREATE TABLE `Client` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `contact_pic` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `industry` varchar(255) DEFAULT NULL,
  `link` varchar(255) DEFAULT NULL,
  `logo` varchar(500) DEFAULT NULL,
  `lead_source` varchar(255) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'ACTIVE',
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `last_contact_date` datetime DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Client`
--

INSERT INTO `Client` (`id`, `name`, `contact_pic`, `contact_phone`, `contact_email`, `industry`, `link`, `logo`, `lead_source`, `status`, `createdAt`, `updatedAt`, `last_contact_date`, `is_verified`) VALUES
(1, 'PT Transportasi Gas Indonesia  (TGI)', 'Ryan Vidyantara', NULL, 'ryan.vidyantara@tgi.co.id', 'Oil & Gas Distribution', 'https://www.tgi.co.id/', '/uploads/logos/logo-1774932829177-32502768.png', 'Friends', 'ACTIVE', '2026-03-12 21:11:09', '2026-04-07 06:49:40', NULL, 0),
(3, 'PT Cahaya Bumi Abadi (CBA)', 'Ignatius Martin Winoto', '+62 812-1040-141', NULL, 'Procurement EPC', 'https://cba-energy.com/', '/uploads/logos/logo-1774874569780-494318238.png', 'Contact', 'ACTIVE', '2026-03-12 21:15:39', '2026-04-07 07:30:47', NULL, 0),
(4, 'PT Dover Chemical', 'Muhammad Luthfi Fadillah', '+62 821-2321-5585', NULL, 'Petrochamical', 'https://dovechem.co.id/id', '/uploads/logos/logo-1774873089579-488706659.jpg', 'Linkedin', 'ACTIVE', '2026-03-12 21:16:58', '2026-04-07 06:44:53', NULL, 0),
(5, 'MTTST Aust', 'Zvon Labadjuk', '+61 410 557 044', 'zvon@mttcor.com.au', 'EPC - Engineering', 'https://www.mttst.com.au/', '/uploads/logos/logo-1774873011455-935118630.jpeg', 'Friends', 'ACTIVE', '2026-03-12 21:18:15', '2026-06-22 00:45:24', '2026-06-22 00:45:24', 0),
(8, 'PT. South Pasific Viscose', 'Ibu Maya (Lapi ITB)', NULL, 'maya.musadi@gmail.com', 'Boiler Stack Dispersion', 'https://www.lenzing.com/', '/uploads/logos/logo-1774918336214-779621926.png', 'friend', 'ACTIVE', '2026-03-31 00:50:19', '2026-03-31 00:54:06', NULL, 0),
(9, 'PT. Tripatra E&C', 'Ganung', NULL, 'Ganung.Priambada@tripatra.com', 'EPC', 'https://www.tripatra.com/en', '/uploads/logos/logo-1774918566981-328996153.jpg', 'Contact Referral', 'LEAD', '2026-03-31 00:56:06', '2026-03-31 00:57:26', NULL, 0),
(10, 'PT Hesa Engineering', 'Iwan', '08385888831', 'iwan@hesa.co.id', 'Flare Stack Noise', 'https://hesa.co.id/', '/uploads/logos/logo-1774918752643-31500770.jpg', 'Contact referral', 'ACTIVE', '2026-03-31 00:59:12', '2026-03-31 04:52:12', NULL, 0),
(11, 'PT. PGN ', 'Faris Muhtadi', ' +62 878-7694-7940', NULL, 'Natural Gas Transmission', 'https://pgn.co.id/', '/uploads/logos/logo-1774918831454-101321730.png', 'Contact Referral', 'LEAD', '2026-03-31 01:00:31', '2026-03-31 01:03:04', NULL, 0),
(12, 'Puslitbang PLN', 'Oksa Prasetyawan', '081910568691', 'oksa.prasetyawan@gmail.com', 'Electricity', 'https://web.pln.co.id/', '/uploads/logos/logo-1774918970086-473073531.png', 'Contact referral', 'ACTIVE', '2026-03-31 01:02:50', '2026-03-31 01:07:03', NULL, 0),
(14, 'PT Alfa Semesta Cemerlang', 'Agus Muadji', NULL, NULL, 'Demister kustom', 'https://www.alfasemesta.co.id/', '/uploads/logos/logo-1774919164209-500159489.jpg', 'Contact Referral', 'LEAD', '2026-03-31 01:06:04', '2026-05-01 08:14:53', NULL, 0),
(15, 'PT. Kaltim Ammonium Nitrat', 'Ahmad Hamdani', '082153000214', 'ahmad.hamdani@kan.id', 'Chemical industry', 'https://kan.id/', '/uploads/logos/logo-1774919369276-701094408.png', 'Contact Referral', 'ACTIVE', '2026-03-31 01:09:29', '2026-06-24 03:19:45', '2026-06-24 03:19:45', 0),
(16, 'PT. TPPI', 'Teguh ', NULL, NULL, 'Petrochemical', 'https://www.tppi.co.id/', '/uploads/logos/logo-1774919469778-918988448.png', 'Contact Referral', 'ACTIVE', '2026-03-31 01:11:09', '2026-03-31 01:11:27', NULL, 0),
(17, 'Petro Shell', 'Faisal ', '08121492880', NULL, 'Pipe Well Rotating Separator', 'https://www.petroshell.com/', '/uploads/logos/logo-1774919514363-939489443.png', 'Contact Referral', 'ACTIVE', '2026-03-31 01:11:54', '2026-03-31 01:12:19', NULL, 0),
(18, 'PT Simtex Mechatronic Indojaya', 'Rizki Putra', '8551588830', 'rizky@simtex.co.id', 'Garment Manufacturing', 'https://www.simtex.co.id/', '/uploads/logos/logo-1774919641591-475602886.jpg', 'Contact Referral', 'ACTIVE', '2026-03-31 01:14:01', '2026-03-31 01:14:42', NULL, 0),
(19, 'PT. Cahaya Mega Bersama', 'Yusnawir', '085216159293', 'pt.cayamegas@gmail.com', 'Condensor and Boiler Room CFD Simulation', NULL, NULL, 'Contact Referral', 'ACTIVE', '2026-03-31 01:16:36', '2026-06-24 03:17:55', '2026-06-24 03:17:55', 0),
(20, 'PT. Cahaya Anodize ', 'Dessy', '818131127', NULL, 'Manufacturing', 'https://caturahvac.com/', '/uploads/logos/logo-1774919840713-600014641.jpg', 'Contact Referral', 'ACTIVE', '2026-03-31 01:17:20', '2026-03-31 01:17:44', NULL, 0),
(22, 'Feen Marine', 'Arfan', '0811348138', NULL, 'gas digestive system', 'https://www.feenmarine.com/', '/uploads/logos/logo-1774920156579-972725088.png', 'Contact Referral', 'ACTIVE', '2026-03-31 01:22:36', '2026-03-31 01:23:20', NULL, 0),
(23, 'PT. Pustek E&T', 'Hasnan', '+62 813-2222-1454', 'hasnan@pustek.com', 'Engineering EPC', 'https://pustek.com/v2/', '/uploads/logos/logo-1774920333192-549459624.png', 'Contact Referral', 'ACTIVE', '2026-03-31 01:25:33', '2026-03-31 04:52:42', NULL, 0),
(24, 'PT. DSSP Sinarmas Power', 'Sekar Istiqomah', '82154802575', NULL, 'energy and infrastructure', 'https://www.dssa.co.id/id', '/uploads/logos/logo-1774920338599-12769516.jpg', 'Conact Referral', 'ACTIVE', '2026-03-31 01:25:38', '2026-03-31 01:26:46', NULL, 0),
(25, 'PT. Tuban Steel Work', 'Edi Rosa', '081311191553', 'eros.edirosa82@gmail.com', 'Manufaktur', 'https://www.tsw.co.id/index.html', '/uploads/logos/logo-1774920543089-123808213.jpeg', 'Contact Referral', 'ACTIVE', '2026-03-31 01:29:03', '2026-06-25 02:22:26', NULL, 0),
(26, 'PT Puspetindo', 'M. Mansur Makruf', '+62 858-7054-4900', 'm.mansur@puspetindo.com', 'Fabrikator', 'https://puspetindo.com/', NULL, 'Referral', 'ACTIVE', '2026-04-01 03:43:12', '2026-04-01 03:44:54', NULL, 0),
(27, 'PT Leighton Asia', '', '', '', 'Contractor', 'https://www.leightonasia.com/', NULL, 'Website', 'ACTIVE', '2026-04-01 03:51:14', '2026-04-01 03:51:14', NULL, 0),
(28, 'PT Ashanua Corp', 'Arsad', '+62 813-1473-4479', 'arsad@ashanua.com', 'Supplier Pump', 'https://ashanua.com/', NULL, 'Referral', 'ACTIVE', '2026-04-06 01:34:36', '2026-04-08 06:43:01', NULL, 0),
(29, 'PT 3S Engineering', 'Sahrudin Tinambunan', '+62 813-2183-9981', NULL, 'Engineering Service', 'https://3s-eng.co.id/', NULL, 'Referral', 'ACTIVE', '2026-04-06 01:37:16', '2026-04-06 01:38:04', NULL, 0),
(30, 'PT TACI (Toyota Denso Automotive Compressor Indonesia)', '', '', '', 'Automotive Fabricator', 'https://tacindonesia.id/', NULL, 'Website', 'ACTIVE', '2026-04-06 01:40:51', '2026-04-06 01:40:51', NULL, 0),
(31, 'PT Takenaka Indonesia', 'Trista Yularis', '+62 811-8715-534', 'trista@takenaka.co.id', 'Constuctors', 'https://takenaka.asia/indonesia', NULL, 'Refferal', 'ACTIVE', '2026-04-06 02:26:31', '2026-04-06 02:27:39', NULL, 0),
(32, 'PT SGS Indonesia', 'Christian Mario ', '+62811 840 3634', 'mario.christian@sgs.com', 'Inspeksi', 'https://www.sgs.com/en-id', NULL, 'Referral', 'ACTIVE', '2026-04-06 07:55:52', '2026-04-06 07:57:48', NULL, 0),
(33, 'PT Tracon Industri', '', '', '', 'EPC', 'https://tracon.co.id/', NULL, 'Website', 'ACTIVE', '2026-04-06 08:14:17', '2026-04-06 08:14:17', NULL, 0),
(34, 'PT Rekayasa Energi Bersama', 'Agus Sudradjat', '+62 822-2122-5109', 'asudradj@gmail.com', 'Engineering', 'https://reka-energi.com/', NULL, 'Website', 'ACTIVE', '2026-04-06 08:16:16', '2026-04-06 08:18:40', NULL, 0),
(35, 'PT JGC Indonesia', '', '', '', 'EPC', 'https://www.jgc-indonesia.com/en/', NULL, 'Refferal', 'ACTIVE', '2026-04-06 08:16:50', '2026-04-06 08:16:50', NULL, 0),
(36, 'PT Pertamina (Persero)', '', '', '', 'Inovasi Rekayasa', 'https://www.pertamina.com/id', NULL, 'Referal', 'ACTIVE', '2026-04-06 08:20:15', '2026-04-06 08:20:15', NULL, 0),
(37, 'PT Matin Perkasa', '', '', '', 'Contractor', 'https://www.matinperkasa.com/', NULL, 'Website', 'ACTIVE', '2026-04-07 04:05:36', '2026-04-07 04:05:36', NULL, 0),
(38, 'PT Yuan Sejati', '', '', '', 'Gas Metering', 'https://www.yuansejati.co.id/', NULL, 'Referral', 'ACTIVE', '2026-04-07 06:50:19', '2026-04-07 06:50:19', NULL, 0),
(39, 'PT Minezawa Trading Indonesia', '', '', '', 'Supplier Blower', 'https://www.minezawa.co.jp/', NULL, 'Website', 'ACTIVE', '2026-04-07 06:56:44', '2026-04-09 02:44:42', NULL, 0),
(40, 'PT Prakarsa Langgeng Maju Bersama', 'Mustopo Ali Sasongko', '+62 811-968-788', NULL, 'Fabrikasi', 'https://www.maju-bersama.com/en/', NULL, 'Referal', 'ACTIVE', '2026-04-07 07:03:51', '2026-04-07 07:04:34', NULL, 0),
(42, 'PT Mitra Wira Pratama (MWP)', '', '', '', 'Supplier Instrumen', 'https://mitrawp.co.id/id/', NULL, 'Referal', 'ACTIVE', '2026-04-07 07:05:40', '2026-06-24 08:19:02', '2026-06-24 03:15:51', 1),
(43, 'PT Supraharmoni Consultindo', 'Agung Setiono', '+62 811-2288-244', NULL, 'Consulting Engineer', NULL, NULL, 'Referal', 'ACTIVE', '2026-04-07 07:09:46', '2026-04-07 07:10:40', NULL, 0),
(44, 'PT Global Mandira Semesta', '', '', '', 'Water Treatment', 'https://globalmandira.co.id/', NULL, 'Referal', 'ACTIVE', '2026-04-07 07:13:58', '2026-06-24 08:18:56', '2026-06-24 03:14:37', 1),
(45, 'PT Bintang Timur Anugerah (BTA)', '', '', '', 'Water Tank Storage', 'https://www.bta.co.id/', NULL, 'Website', 'ACTIVE', '2026-04-07 07:23:20', '2026-04-08 06:44:47', NULL, 0),
(46, 'PT TOP F', 'Teguh Herman', '+62 858-1068-6630', 'teguh.herman@top-f.co.id', 'Fabrikasi', 'https://top-f.co.id/', NULL, 'Referal', 'ACTIVE', '2026-04-07 07:25:31', '2026-06-24 08:18:54', '2026-06-24 06:50:41', 1),
(47, 'PT Westindo Esa Perkasa', '', '', '', 'Contractors Data Center', 'https://www.westindo.com/', NULL, NULL, 'ACTIVE', '2026-04-07 07:33:42', '2026-04-07 07:33:42', NULL, 0),
(48, 'PT Traktor Nusantara', '', '', '', 'Heavy Equipment', 'https://www.traknus.co.id/id', NULL, 'Website', 'ACTIVE', '2026-04-07 07:37:00', '2026-04-07 07:37:00', NULL, 0),
(49, 'PT Gerbang Saranabaja (GSB)', 'Wahyu Muchtriman', '081282772042', 'eng_vessel2@gsb.co.id', 'Fabrication', 'https://gsb.co.id/', NULL, 'Website', 'ACTIVE', '2026-04-07 07:44:02', '2026-05-01 08:13:20', NULL, 0),
(50, 'PT PLN Nusantara Power', '', '', '', 'Power Energy', 'https://www.plnnusantarapower.co.id/', NULL, 'Website', 'ACTIVE', '2026-04-08 05:02:37', '2026-04-08 05:02:37', NULL, 0),
(51, 'PT Pembangkitan Jawa Bali (PJB)', '', '', '', 'Power Energy', 'https://www.ptplnnr.com/id', NULL, 'Website', 'ACTIVE', '2026-04-08 05:04:34', '2026-04-08 05:04:34', NULL, 0),
(52, 'PT Pamulang Teknologi Engineering', 'RIfqi Imanto', '+62 811-9766-776', NULL, 'SCADA, IoT', 'https://pamtek.co.id/', NULL, 'Referal', 'ACTIVE', '2026-04-08 05:09:29', '2026-06-26 00:28:38', '2026-06-23 02:51:49', 1),
(53, 'PT Acritas Sumber Organik', '', '', '', 'Waste Management', 'https://www.acritas-energy.com/', NULL, 'Website', 'ACTIVE', '2026-04-08 07:42:48', '2026-06-26 00:28:42', '2026-06-23 02:49:11', 1),
(54, 'PT. Synnex Metrodata Indonesia', '', '', '', 'Distribusi teknologi dan solusi ICT (Information & Communication Technology)', 'https://www.synnexmetrodata.com', NULL, 'Website', 'ACTIVE', '2026-04-21 01:50:35', '2026-04-21 01:51:18', NULL, 0),
(55, 'PT. Caleb Technology', '', '', '', 'Otomasi Industri, Integrasi Perusahaan, dan Solusi Manufaktur Strategis.', 'https://caleb-technology.com/id/', NULL, 'Website', 'ACTIVE', '2026-04-21 01:55:29', '2026-04-21 01:55:29', NULL, 0),
(56, 'Aligned Energy Pte Ltd.', '', '', '', 'Green Fuels', 'https://www.alignedenergy.sg/', NULL, 'Website', 'ACTIVE', '2026-04-21 02:00:32', '2026-04-21 02:00:32', NULL, 0),
(57, 'PT. Gheni Artha Sejahtera', '', '', '', 'Natural gas and renewable energy industries. ', 'https://www.gassolution.co.id/', NULL, 'Website', 'ACTIVE', '2026-04-21 02:03:58', '2026-06-24 08:18:48', '2026-06-23 02:45:21', 1),
(58, 'PT. Expro', '', '', '', 'Oil & Gas', 'https://www.expro.com/', NULL, 'Website', 'ACTIVE', '2026-04-21 02:14:47', '2026-04-21 02:14:47', NULL, 0),
(59, 'PT. Stainless Steel Primavalve Majubersama', '', '', '', 'Manufacturer and distributor of stainless steel', 'https://spvmb.com/en-id', NULL, 'Website', 'ACTIVE', '2026-04-21 02:20:08', '2026-04-21 02:20:08', NULL, 0),
(60, 'PT. Saeyong Magna Utama', '', '', '', 'Supply chain management for the oil and gas industry', 'https://www.saeyong.co.id/', NULL, 'Website', 'ACTIVE', '2026-04-21 02:24:54', '2026-04-21 02:24:54', NULL, 0),
(61, 'PT. Prakarsalanggeng Majubersama', '', '', '', 'Hygienic, chemical, and energy process industries', 'https://maju-bersama.com/wp/', NULL, 'Website', 'ACTIVE', '2026-04-21 02:34:09', '2026-06-30 01:04:19', '2026-06-23 02:39:49', 0),
(62, 'PT. Sulzer Indonesia', '', '', '', 'Rotating Equipment', 'https://www.sulzer.com/en', NULL, 'Website', 'ACTIVE', '2026-04-21 02:37:20', '2026-06-30 01:04:20', '2026-06-23 02:35:38', 0),
(63, 'Halim Tehnik', '', '', '', NULL, NULL, NULL, NULL, 'ACTIVE', '2026-04-21 02:41:02', '2026-04-21 02:41:02', NULL, 0),
(64, 'PT Meltech Consultindo', 'Suharyana', ' +62 877-3877-0454', 'phesuharyana@gmail.com', 'MEP', 'https://meltech.co.id/', NULL, 'Website', 'ACTIVE', '2026-04-29 01:32:21', '2026-04-29 03:08:13', NULL, 0),
(65, 'PT Chandra Asri Pacific', 'Imam Fatharani', '+62 813-9331-4772', NULL, 'Petrochemical', 'https://chandra-asri.com/id', NULL, 'Website', 'ACTIVE', '2026-04-29 03:14:51', '2026-06-24 08:18:38', '2026-06-23 02:30:55', 1),
(66, 'PT Surya Kwong Sung', 'Stephen', '+62 878-7677-2196', 'stephen@3dscanindonesia.co.id', '3D Laser Scan', 'https://www.3dscanindonesia.co.id/', NULL, 'Website', 'ACTIVE', '2026-05-04 02:46:33', '2026-06-19 08:16:37', '2026-06-19 05:38:31', 1),
(75, 'PT Catur Prima Teknik', 'Aryo', '+62 851-2130-8789', NULL, NULL, NULL, NULL, NULL, 'ACTIVE', '2026-06-15 07:11:24', '2026-06-19 13:02:33', '2026-06-19 13:02:33', 0),
(77, 'PT SPV', '', '', '', NULL, NULL, NULL, NULL, 'ACTIVE', '2026-06-15 07:19:47', '2026-06-19 08:16:34', '2026-06-19 04:12:35', 1);

-- --------------------------------------------------------

--
-- Table structure for table `ClientContact`
--

CREATE TABLE `ClientContact` (
  `id` int(11) NOT NULL,
  `clientId` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `position` varchar(255) DEFAULT NULL,
  `isPrimary` tinyint(1) DEFAULT 0,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ClientContact`
--

INSERT INTO `ClientContact` (`id`, `clientId`, `name`, `email`, `phone`, `position`, `isPrimary`, `createdAt`, `updatedAt`) VALUES
(5, 8, 'Ibu Maya (Lapi ITB)', 'maya.musadi@gmail.com', NULL, NULL, 1, '2026-03-31 00:53:57', '2026-03-31 00:54:06'),
(6, 9, 'Ganung', 'Ganung.Priambada@tripatra.com', NULL, NULL, 1, '2026-03-31 00:56:06', '2026-03-31 00:57:26'),
(7, 10, 'Iwan', 'iwan@hesa.co.id', '08385888831', NULL, 1, '2026-03-31 00:59:12', '2026-03-31 00:59:48'),
(8, 11, 'Faris Muhtadi', NULL, ' +62 878-7694-7940', NULL, 1, '2026-03-31 01:00:31', '2026-03-31 01:02:25'),
(9, 12, 'Oksa Prasetyawan', 'oksa.prasetyawan@gmail.com', '081910568691', NULL, 1, '2026-03-31 01:02:50', '2026-03-31 01:03:20'),
(11, 14, 'Agus Muadji', NULL, NULL, NULL, 1, '2026-03-31 01:06:04', '2026-03-31 01:07:13'),
(12, 15, 'Ahmad Hamdani', 'ahmad.hamdani@kan.id', '082153000214', NULL, 1, '2026-03-31 01:09:29', '2026-03-31 01:10:24'),
(13, 16, 'Teguh ', NULL, NULL, NULL, 1, '2026-03-31 01:11:09', '2026-03-31 01:11:27'),
(14, 17, 'Faisal ', NULL, '08121492880', NULL, 1, '2026-03-31 01:11:54', '2026-03-31 01:12:19'),
(15, 18, 'Rizki Putra', 'rizky@simtex.co.id', '8551588830', NULL, 1, '2026-03-31 01:14:01', '2026-03-31 01:14:42'),
(16, 19, 'Yusnawir', 'pt.cayamegas@gmail.com', '085216159293', NULL, 1, '2026-03-31 01:16:36', '2026-03-31 01:17:13'),
(17, 20, 'Dessy', NULL, '818131127', NULL, 1, '2026-03-31 01:17:20', '2026-03-31 01:17:44'),
(19, 22, 'Arfan', NULL, '0811348138', NULL, 1, '2026-03-31 01:22:36', '2026-03-31 01:23:20'),
(20, 23, 'Hasnan', 'hasnan@pustek.com', '+62 813-2222-1454', NULL, 1, '2026-03-31 01:25:33', '2026-03-31 01:26:02'),
(21, 24, 'Sekar Istiqomah', NULL, '82154802575', NULL, 1, '2026-03-31 01:25:38', '2026-03-31 01:26:46'),
(22, 25, 'Edi Rosa', 'eros.edirosa82@gmail.com', '081311191553', NULL, 1, '2026-03-31 01:29:03', '2026-06-25 02:22:26'),
(23, 26, 'M. Mansur Makruf', 'm.mansur@puspetindo.com', '+62 858-7054-4900', 'Project Development', 1, '2026-04-01 03:43:12', '2026-04-01 03:44:54'),
(24, 26, 'Abdul Charis', 'charis@puspetindo.com', '+62 856-4005-6860', 'Project Engineering', 0, '2026-04-01 03:46:11', '2026-04-01 03:46:11'),
(25, 26, 'Fahmi Fauzi Handoko', 'handokofahmi0@gmail.com', '+62 856-0601-9744', 'Mechanical Engineer', 0, '2026-04-01 03:47:09', '2026-04-01 03:47:09'),
(26, 24, 'Muhammad Sayed', NULL, '+62 811-847-183', 'Mechanical Engineer', 0, '2026-04-01 03:48:36', '2026-04-01 03:48:36'),
(27, 23, 'M. Hazairin', NULL, '+62 811-847-183', 'COO', 0, '2026-04-01 03:49:30', '2026-04-01 03:49:30'),
(28, 27, '', NULL, NULL, NULL, 1, '2026-04-01 03:51:14', '2026-04-01 03:51:14'),
(29, 27, 'Linton Panjaitan', 'linton.panjaitan@leightonasia.com', '+62 812-9718-8636', 'Mechanical Engineer', 0, '2026-04-01 03:51:58', '2026-04-01 03:51:58'),
(30, 24, 'Sanudi', NULL, '+62 877-2334-8334', 'Field Engineer', 0, '2026-04-02 00:28:08', '2026-04-02 00:28:08'),
(31, 11, 'Posma Sirait', NULL, '+62 816-398-493', 'Head Operation and Maintenance Management ', 0, '2026-04-02 00:29:39', '2026-04-02 00:29:39'),
(32, 5, 'Zvon Labadjuk', 'zvon@mttcor.com.au', '+61 410 557 044', 'Direktur Sales and Engineer', 1, '2026-04-04 04:06:30', '2026-04-04 04:06:30'),
(33, 28, 'Sekar', NULL, '+62 811-8461-268', 'Admin', 0, '2026-04-06 01:34:36', '2026-04-09 01:36:54'),
(34, 28, 'Arsad', 'arsad@ashanua.com', '+62 813-1473-4479', 'Direktur', 1, '2026-04-06 01:35:42', '2026-04-08 06:43:01'),
(35, 29, 'Sahrudin Tinambunan', NULL, '+62 813-2183-9981', 'CEO', 1, '2026-04-06 01:37:16', '2026-04-06 01:38:04'),
(36, 30, '', NULL, NULL, NULL, 1, '2026-04-06 01:40:51', '2026-04-06 01:40:51'),
(37, 30, 'Irwan Prasetyo', 'irwan.prasetyo@taci.toyota-industries.com', '+62 896-5558-2392', 'Site Engineer', 0, '2026-04-06 01:43:18', '2026-04-06 01:43:18'),
(39, 31, 'Trista Yularis', 'trista@takenaka.co.id', '+62 811-8715-534', 'Project Manager', 1, '2026-04-06 02:27:39', '2026-04-06 02:27:39'),
(40, 31, 'Arland Syarief', 'arland@takenaka.co.id', '+62 877-4834-8285', 'Mechanical Engineer', 0, '2026-04-06 02:34:42', '2026-04-06 02:34:42'),
(41, 32, 'Christian Mario ', 'mario.christian@sgs.com', '+62811 840 3634', 'Head of Industrial', 1, '2026-04-06 07:55:52', '2026-04-06 07:57:48'),
(42, 32, 'Chodi Soetjipto', 'chodi.soetjipto@sgs.com', '+62 877-8165-2163', 'Procurement', 0, '2026-04-06 07:56:45', '2026-04-06 07:56:45'),
(43, 32, 'Galih Indro Tanoyo', 'galih.tanoyo@gmail.com', '+62 812-8371-8500', 'Sales Engineer', 0, '2026-04-06 07:58:54', '2026-04-06 07:58:54'),
(44, 9, 'Bimo Aulia Sukarno', 'bimo.aulia@tripatra.com', '+62 857-2022-4991', 'Procurement', 0, '2026-04-06 08:00:13', '2026-04-06 08:00:13'),
(45, 33, '', NULL, NULL, NULL, 1, '2026-04-06 08:14:17', '2026-04-06 08:14:17'),
(46, 34, '', NULL, NULL, NULL, 0, '2026-04-06 08:16:16', '2026-04-06 08:18:40'),
(47, 35, '', NULL, NULL, NULL, 1, '2026-04-06 08:16:50', '2026-04-06 08:16:50'),
(48, 33, 'Umar Abdul Aziz', NULL, '+62 812-7835-4473', 'Mechanical Engineering', 0, '2026-04-06 08:17:22', '2026-04-06 08:17:22'),
(49, 35, 'Anggun Trantika Maranata', NULL, '+62 817-4177-102', 'Project Engineer', 0, '2026-04-06 08:17:56', '2026-04-06 08:17:56'),
(50, 34, 'Agus Sudradjat', 'asudradj@gmail.com', '+62 822-2122-5109', 'Direktur', 1, '2026-04-06 08:18:40', '2026-04-06 08:18:40'),
(51, 36, '', NULL, NULL, NULL, 1, '2026-04-06 08:20:15', '2026-04-06 08:20:15'),
(52, 37, '', NULL, NULL, NULL, 1, '2026-04-07 04:05:36', '2026-04-07 04:05:36'),
(53, 37, 'Suryanto Zhang', 'info@matinperkasa.com', '+62 823-8634-0328', 'Mechanical Engineer', 0, '2026-04-07 06:37:51', '2026-04-07 06:37:51'),
(54, 36, 'Agustina Eliyanti', 'mk.agustina.eliyanti@mitrakerja.pertamina.com', '+62 815-8610-6176', 'Senior Lab', 0, '2026-04-07 06:39:04', '2026-04-07 06:39:04'),
(55, 36, 'Nurul Dela', 'nurul.dela@pertamina.com', '+62 822-1414-1490', 'Senior Process Engineer', 0, '2026-04-07 06:39:57', '2026-04-07 06:39:57'),
(56, 36, 'Nita Haspriyanti', 'nita.haspriyanti@pertamina.com', NULL, 'Lab Senior Engineer', 0, '2026-04-07 06:40:21', '2026-04-07 06:40:21'),
(57, 34, 'Sutomo', 'sutomo@reka-energi.com', '+62 812-1094-917', 'Sales Engineer', 0, '2026-04-07 06:41:08', '2026-04-07 06:41:08'),
(58, 24, 'Subhan Hasisi', NULL, '+62 813-9215-5516', 'Plant Head', 0, '2026-04-07 06:43:39', '2026-04-07 06:43:39'),
(59, 4, 'Muhammad Luthfi Fadillah', NULL, '+62 821-2321-5585', 'Process Engineer', 1, '2026-04-07 06:44:53', '2026-04-07 06:44:53'),
(60, 4, 'Andri Kapuja Kaharian', 'andri.kaharian@dovechem.co.id', '+62 851-7781-9400', 'Head Of Engineer', 0, '2026-04-07 06:46:12', '2026-04-07 06:46:12'),
(61, 1, 'Akbar Tandjung', 'akbar.tanjung@tgi.co.id', '+62 852-3291-6881', 'Risk Management and Corporata Manager', 0, '2026-04-07 06:47:41', '2026-04-07 06:49:40'),
(62, 1, 'Sigit Asmara', NULL, '+62 813-2115-3064', 'Civil Engineer', 0, '2026-04-07 06:49:08', '2026-04-07 06:49:08'),
(63, 1, 'Ryan Vidyantara', 'ryan.vidyantara@tgi.co.id', NULL, 'Pipeline Integrity Manager', 1, '2026-04-07 06:49:40', '2026-04-07 06:49:40'),
(64, 38, '', NULL, NULL, NULL, 1, '2026-04-07 06:50:19', '2026-04-07 06:50:19'),
(65, 38, 'Nanang Y', NULL, '+62 817-886-000', 'Senior Pipeline Engineer ', 0, '2026-04-07 06:50:53', '2026-04-07 06:50:53'),
(66, 38, 'Made F. Saputra', NULL, '+62 811-1876-333', 'Direktur', 0, '2026-04-07 06:51:29', '2026-04-07 06:51:29'),
(67, 9, 'Benhard Walter Hutajulu', 'benhard.hutajulu@tripatra.com', '+62 812-4658-6031', 'Project Engineer', 0, '2026-04-07 06:53:02', '2026-04-07 06:53:02'),
(68, 9, 'Fajar Haris Gumilang', 'fajar.gumilang@tripatra.com', '+62 812-5979-332', 'Piping Engineer', 0, '2026-04-07 06:53:55', '2026-04-07 06:53:55'),
(69, 39, '', NULL, NULL, NULL, 1, '2026-04-07 06:56:44', '2026-04-07 06:56:44'),
(70, 39, 'Siti Marwah', 'sales2@minezawa.co.id', '+62 812-9854-7920', 'Sales', 0, '2026-04-07 06:57:38', '2026-04-07 06:57:38'),
(71, 3, 'Ignatius Martin Winoto', NULL, '+62 812-1040-141', 'Direktur Utama', 1, '2026-04-07 07:00:01', '2026-04-07 07:00:01'),
(72, 3, 'Andri Ali Djuhaepa', 'sales@cba-energy.com', '+62 811-9292-981', 'Sales Engineer', 0, '2026-04-07 07:00:53', '2026-04-07 07:00:53'),
(73, 40, '', NULL, NULL, NULL, 0, '2026-04-07 07:03:51', '2026-04-07 07:04:34'),
(75, 40, 'Mustopo Ali Sasongko', NULL, '+62 811-968-788', 'CEO', 1, '2026-04-07 07:04:34', '2026-04-07 07:04:34'),
(76, 42, '', NULL, NULL, NULL, 1, '2026-04-07 07:05:40', '2026-04-07 07:05:40'),
(77, 42, 'Bhenny Setyawan', 'bhenny@mitrawp.com', '+62 897-9615-464', 'Sales Engineer SPV', 0, '2026-04-07 07:07:32', '2026-04-07 07:07:32'),
(78, 42, 'Ben Marto', 'bens@mitrawp.com', '+62 859-2144-3032', 'Sales Engineer', 0, '2026-04-07 07:08:46', '2026-04-07 07:08:46'),
(79, 43, '', NULL, NULL, NULL, 0, '2026-04-07 07:09:46', '2026-04-07 07:10:40'),
(80, 43, 'Agung Setiono', NULL, '+62 811-2288-244', 'CEO', 1, '2026-04-07 07:10:33', '2026-04-07 07:10:40'),
(81, 43, 'Tri Budi Wibowo', NULL, '+62 812-3957-9331', 'Direktur Operasional', 0, '2026-04-07 07:11:35', '2026-04-07 07:11:35'),
(83, 44, '', NULL, NULL, NULL, 1, '2026-04-07 07:13:58', '2026-04-07 07:13:58'),
(84, 44, 'Nizar Dwi Wibowo', NULL, '+62 811-1320-6255', 'Sales and Product Development', 0, '2026-04-07 07:14:51', '2026-04-07 07:14:51'),
(85, 45, '', NULL, NULL, NULL, 1, '2026-04-07 07:23:20', '2026-04-07 07:23:20'),
(86, 45, 'Liyanti Wibawati', 'liyanti.wibawati@bta.co.id', '+62 878-7776-2018', 'Sales', 0, '2026-04-07 07:24:04', '2026-04-07 07:24:04'),
(87, 45, 'Teguh Santoso', 'teguhbta1@yahoo.co.id', '+62 817-0991-199', 'Engineer', 0, '2026-04-07 07:25:06', '2026-04-07 07:25:06'),
(88, 46, '', NULL, NULL, NULL, 0, '2026-04-07 07:25:31', '2026-04-07 07:26:24'),
(89, 46, 'Teguh Herman', 'teguh.herman@top-f.co.id', '+62 858-1068-6630', 'Direktur', 1, '2026-04-07 07:26:24', '2026-04-07 07:26:24'),
(90, 46, 'Andi Prasetyo', 'andi.prasetyo@cba-energy.com', '+62 813-4639-8763', 'Procurement', 0, '2026-04-07 07:30:21', '2026-04-07 07:30:21'),
(91, 3, 'Andi Prasetyo', 'andi.prasetyo@cba-energy.com', '+62 813-4639-8763', 'Procurement', 0, '2026-04-07 07:31:09', '2026-04-07 07:31:09'),
(92, 47, '', NULL, NULL, NULL, 1, '2026-04-07 07:33:42', '2026-04-07 07:33:42'),
(93, 47, 'Mery Saswanti', NULL, '+62 857-7343-2018', 'Sales Manager', 0, '2026-04-07 07:34:05', '2026-04-07 07:34:05'),
(94, 47, ' Gesang Wahyudi', NULL, '+62 856-7299-561', 'Design Solution Lead', 0, '2026-04-07 07:35:22', '2026-04-07 07:35:22'),
(95, 48, '', NULL, NULL, NULL, 1, '2026-04-07 07:37:00', '2026-04-07 07:37:00'),
(96, 48, 'Ghanny Sirat', 'ghanny.sirat@traknus.co.id', '+62 819-0244-0533', 'Application Engineer', 0, '2026-04-07 07:38:19', '2026-04-07 07:38:19'),
(97, 48, 'Arifian Firdaus', 'arifian.firdaus@traknus.co.id', NULL, 'Marketing Division', 0, '2026-04-07 07:39:22', '2026-04-07 07:39:22'),
(98, 49, 'Wahyu Muchtriman', 'eng_vessel2@gsb.co.id', '081282772042', 'Manager Sales PV', 1, '2026-04-07 07:44:02', '2026-05-01 08:13:20'),
(99, 49, 'Budhi Suindera', 'marketingvessel@gsb.co.id', '+62 856-9330-3879', 'Marketing SPV', 0, '2026-04-07 07:46:07', '2026-04-07 07:46:07'),
(100, 50, '', NULL, NULL, NULL, 1, '2026-04-08 05:02:37', '2026-04-08 05:02:37'),
(101, 51, '', NULL, NULL, NULL, 1, '2026-04-08 05:04:34', '2026-04-08 05:04:34'),
(102, 51, 'Ahmad Barkati', 'ahmad.barkati01@gmail.com', '+62 815-2090-6492', 'Mechanical Design Engieer', 0, '2026-04-08 05:06:01', '2026-04-08 05:06:01'),
(103, 50, 'Arif Pratama', 'arif.pratama@plnnusantarapower.co.id', '‪+62 821‑3852‑1221‬', 'Instrumen dan Kontrol Engineer', 0, '2026-04-08 05:08:47', '2026-04-08 05:08:47'),
(104, 52, '', NULL, NULL, NULL, 0, '2026-04-08 05:09:29', '2026-04-08 05:10:33'),
(105, 52, 'RIfqi Imanto', NULL, '+62 811-9766-776', 'CEO', 1, '2026-04-08 05:10:23', '2026-04-08 05:10:33'),
(106, 50, 'Faishol Arif', 'faishol.arif@plnnusantarapower.co.id', NULL, 'Engineer', 0, '2026-04-08 05:11:59', '2026-04-08 05:11:59'),
(107, 53, '', NULL, NULL, NULL, 1, '2026-04-08 07:42:48', '2026-04-08 07:42:48'),
(108, 53, 'Regina', NULL, '+62 813-3238-6324', 'Process Engineer', 0, '2026-04-08 07:43:16', '2026-04-08 07:43:16'),
(109, 53, 'Adi Tama', NULL, '+62 857-7912-3478', 'Sr. Plant Engineer', 0, '2026-04-08 07:43:51', '2026-04-08 07:43:51'),
(110, 53, 'Mufti', NULL, '+62 812-3539-9991', 'Procurement', 0, '2026-04-08 07:44:17', '2026-04-08 07:44:17'),
(111, 54, '', NULL, NULL, NULL, 1, '2026-04-21 01:50:35', '2026-04-21 01:50:35'),
(112, 54, 'Steven Wijaya', 'Steven.Huang@metrodata.co.id', '+6285882438486', 'Product Marketing', 0, '2026-04-21 01:53:22', '2026-04-21 01:53:22'),
(113, 55, '', NULL, NULL, NULL, 1, '2026-04-21 01:55:29', '2026-04-21 01:55:29'),
(114, 55, 'Lifton Silalahi', 'lifton@caleb-technology.com', '+6285780115610', 'Sales Manager', 0, '2026-04-21 01:57:15', '2026-04-21 01:57:15'),
(115, 56, '', NULL, NULL, NULL, 1, '2026-04-21 02:00:32', '2026-04-21 02:00:32'),
(116, 56, 'Toga Sihombing', 'togasihombing@alignedenergy.sg', '+6281375657632', 'Head of Production', 0, '2026-04-21 02:02:01', '2026-04-21 02:02:01'),
(117, 57, '', NULL, NULL, NULL, 1, '2026-04-21 02:03:58', '2026-04-21 02:03:58'),
(118, 57, 'Anca Arbansyah', 'anca@gassolution.co.id', '+628115448969', 'Head of Kalimantan Regional Branch', 0, '2026-04-21 02:05:33', '2026-04-21 02:05:33'),
(119, 56, 'Jean Jacques Lavigne', 'jjlavigne@alignedenergy.sg', '+6597461202', 'Founder/CEO', 0, '2026-04-21 02:13:12', '2026-04-21 02:13:12'),
(120, 58, '', NULL, NULL, NULL, 1, '2026-04-21 02:14:47', '2026-04-21 02:14:47'),
(121, 58, 'Tyler Jeffery', 'TylerJeffery@expro.com', NULL, 'Senior Sales Manager Production Product Line', 0, '2026-04-21 02:16:38', '2026-04-21 02:16:38'),
(122, 59, '', NULL, NULL, NULL, 1, '2026-04-21 02:20:08', '2026-04-21 02:20:08'),
(123, 59, 'Saleh Abdad', 'saleh.abdad@spvmb.com', '+6281119091817', 'Senior International Sales Manager', 0, '2026-04-21 02:21:51', '2026-04-21 02:21:51'),
(124, 58, 'Galih Erlangga', 'galih.erlangga@expro.com', '+6281318890507', 'Country Sales Manager', 0, '2026-04-21 02:23:22', '2026-04-21 02:23:22'),
(125, 60, '', NULL, NULL, NULL, 1, '2026-04-21 02:24:54', '2026-04-21 02:24:54'),
(126, 60, 'Ahmad Hafizh', 'ahmad.hafizh@saeyong.co.id', '+6282132353355', 'Upstream Sales Manager', 0, '2026-04-21 02:26:33', '2026-04-21 02:26:33'),
(127, 58, 'Sabam Tumanggor', 'sabam.tumanggor@expro.com', '+628118715602', 'Country Manager', 0, '2026-04-21 02:30:24', '2026-04-21 02:30:24'),
(128, 58, 'Adarsh Nath', 'adarsh.nath@expro.com', '+60196366197', 'Regional Technical Sales Manager', 0, '2026-04-21 02:32:32', '2026-04-21 02:32:32'),
(129, 61, '', NULL, NULL, NULL, 1, '2026-04-21 02:34:09', '2026-04-21 02:34:09'),
(130, 61, 'Yehal Trisiswan', 'yehal@maju-bersama.com', '+62811118667', 'Head of Sales & Marketing Dept', 0, '2026-04-21 02:36:00', '2026-04-21 02:36:00'),
(131, 62, '', NULL, NULL, NULL, 1, '2026-04-21 02:37:20', '2026-04-21 02:37:20'),
(132, 62, 'Yordian Fachrie', 'yordan.fachrie@sulzer.com', '+6281190006131', 'Area Sales Manager-Pump Service', 0, '2026-04-21 02:39:21', '2026-04-21 02:39:21'),
(133, 63, '', NULL, NULL, NULL, 1, '2026-04-21 02:41:02', '2026-04-21 02:41:02'),
(134, 63, 'Sudiyanto Halim', 'sudiyantohalim@halimtehnik.com', '+62816805117', 'President Director', 0, '2026-04-21 02:42:09', '2026-04-21 02:42:09'),
(135, 64, 'Suharyana', 'phesuharyana@gmail.com', ' +62 877-3877-0454', 'Owner', 1, '2026-04-29 01:32:21', '2026-04-29 03:08:13'),
(136, 65, 'Imam Fatharani', NULL, '+62 813-9331-4772', 'Process Engineer', 1, '2026-04-29 03:14:51', '2026-04-29 03:15:24'),
(137, 66, 'Stephen', 'stephen@3dscanindonesia.co.id', '+62 878-7677-2196', 'Direktur', 1, '2026-05-04 02:46:33', '2026-05-04 02:48:01'),
(146, 75, 'Aryo', NULL, '+62 851-2130-8789', NULL, 1, '2026-06-15 07:11:24', '2026-06-15 07:16:59'),
(148, 77, '', NULL, NULL, NULL, 1, '2026-06-15 07:19:47', '2026-06-15 07:19:47'),
(149, 77, 'K Seto', NULL, '+62 896-3071-4510', NULL, 0, '2026-06-15 07:20:31', '2026-06-15 07:20:31');

-- --------------------------------------------------------

--
-- Table structure for table `ClientNote`
--

CREATE TABLE `ClientNote` (
  `id` int(11) NOT NULL,
  `clientId` int(11) NOT NULL,
  `note` text NOT NULL,
  `createdBy` varchar(255) DEFAULT NULL,
  `createdAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ClientNote`
--

INSERT INTO `ClientNote` (`id`, `clientId`, `note`, `createdBy`, `createdAt`) VALUES
(1, 39, 'PT. Minezawa Trading Indonesia\nTRIVIUM Terrace Apartment, BIIE Kav No.03-05 1st floor S-0102, Bekasi Kabupaten, 17530, ID\nwww.minezawa.co.jp\n\nhttps://maps.app.goo.gl/bERwhPbG3u7GnT9R9', 'System', '2026-04-09 02:46:34'),
(2, 49, '1. Meeting dengan sales manager Pressure vessle (wahyu)\n2. Diskusi tentang skema dan kerja sama terkait kebutuhan engineering dari perusahaan (PT GSB)\n3. GSB membantu puspetindo dalam forming\n4. GSB punya spesialis di dalam pressure vessel dan pembuatan test tank separator\n5. Mereka perlu tim proces, tim engineering utk membantu membuat mereka naik value dan mendapatkan banyak orderan\n6. Analisis jg terkait CAPEX dan OPEX serta BEP dari sebuah investasi alat yang kita buat utk pekerjaan di industri oil n gas\n', 'System', '2026-05-01 08:12:15'),
(3, 32, '1. Perusahaan ini fokus di inspeksi\n2. Mendalami terkait health, environment dan industri\n3. Kebutuhan terkait feasiblity study \n4. Berkaitan dengan engineering dan standarisasi ISO \n\nPerdekat hubungan dengan Pak Galih, karena banyak memberikan sumber informasi project dan pekerjaan', 'System', '2026-05-01 08:14:31'),
(4, 14, '1. Engineering, memiliki basic proses yang kuat \n2. Trading, menjual produk teknologi utk demister dan alat-alat separator\n3. Instalasi.\n\n*) Membuka peluang utk riset dan pengembangan produk, apabila diperlukan dan bisa diimplementasikan utk kebutuhan industri dengan pemahaman komprehensif\n', 'System', '2026-05-01 08:15:54'),
(5, 28, '1. Supplier pompa dan fan utk industri dan pekerjaan SDA\n2. Kadang memerlukan CFD dan FEA utk studi kelayakan dalam produk dan kebutuhan mereka\n3. Perlu selektif dalam menerima client yang memerlukan permintaan engineering, karena terkadang mereka hanya mencari spek dan nantinya dicarikan ke vendor lain yang lebih murah. (Etika bisnis diperlukan)', 'System', '2026-05-01 08:17:16'),
(6, 30, '1. baru ada 1 proyek \n2. 1 perencanaan\n3. Rencana 6 proeyek semuanya', 'System', '2026-05-02 02:38:05'),
(7, 30, '1. Lebih difokuskan pada kecepatan di ketinggian 1.5 m\n2. karena terkait kondisi kenyamanan\n3. Pembuatan BAST utk progress dari hasil simulasi CFD ke TACI utk penarikan uang\n', 'System', '2026-05-02 02:40:41'),
(8, 63, '1. Opsi kita kunjungi di bulan depan', 'System', '2026-05-04 02:45:22'),
(9, 45, '1. Diskusi terkait pembuatan kalkulator teknik utk mempercepat proses perhitungan mereka dalam desain\n2. Engineering company diperlukan utk mempercepat proses mereka', 'System', '2026-05-04 03:04:08'),
(10, 66, '1. Meeting offline dengan mereka', 'System', '2026-05-04 05:26:23');

-- --------------------------------------------------------

--
-- Table structure for table `clients`
--

CREATE TABLE `clients` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `company` varchar(255) DEFAULT NULL,
  `industry` varchar(100) DEFAULT NULL,
  `source` varchar(100) DEFAULT NULL,
  `last_contact` datetime DEFAULT NULL,
  `lead_score` int(11) DEFAULT 0,
  `status` enum('Lead','Proposal','Hold','Loss','Won','Done') NOT NULL DEFAULT 'Lead',
  `value` decimal(15,2) DEFAULT 0.00,
  `owner_id` int(11) DEFAULT NULL,
  `verified` tinyint(1) DEFAULT 0,
  `phone` varchar(50) DEFAULT NULL,
  `logo_url` mediumtext DEFAULT NULL,
  `location` varchar(255) DEFAULT 'Jakarta',
  `company_size` varchar(50) DEFAULT '50-200',
  `deadline` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `client_contacts`
--

CREATE TABLE `client_contacts` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Config`
--

CREATE TABLE `Config` (
  `key` varchar(100) NOT NULL,
  `value` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_uca1400_ai_ci;

--
-- Dumping data for table `Config`
--

INSERT INTO `Config` (`key`, `value`) VALUES
('invoice_counter_2026', '14');

-- --------------------------------------------------------

--
-- Table structure for table `content_calendar`
--

CREATE TABLE `content_calendar` (
  `id` int(11) NOT NULL,
  `campaign_id` int(11) DEFAULT NULL,
  `platform` enum('Instagram','TikTok','Blog','Email','Other') DEFAULT NULL,
  `content_title` varchar(255) NOT NULL,
  `publish_date` datetime DEFAULT NULL,
  `status` enum('Planned','In Progress','Ready','Published') DEFAULT 'Planned'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `FixedAsset`
--

CREATE TABLE `FixedAsset` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` enum('Peralatan IT','Kendaraan','Furniture','Bangunan','Mesin','Lainnya') NOT NULL,
  `acquisition_value` decimal(15,2) NOT NULL,
  `acquisition_date` date NOT NULL,
  `useful_life_years` int(11) NOT NULL DEFAULT 4,
  `notes` text DEFAULT NULL,
  `createdBy` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `FixedAsset`
--

INSERT INTO `FixedAsset` (`id`, `name`, `category`, `acquisition_value`, `acquisition_date`, `useful_life_years`, `notes`, `createdBy`, `createdAt`, `updatedAt`) VALUES
(1, 'Proyektor EB-X500', 'Peralatan IT', 6500000.00, '2024-02-01', 5, NULL, 2, '2026-07-06 08:06:49', '2026-07-06 08:06:49'),
(2, 'Meja meeting', 'Furniture', 1400000.00, '2022-01-01', 10, NULL, 2, '2026-07-08 02:57:48', '2026-07-08 02:57:48');

-- --------------------------------------------------------

--
-- Table structure for table `interactions`
--

CREATE TABLE `interactions` (
  `id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `type` varchar(50) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `creator_name` varchar(255) DEFAULT 'System',
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Invoice`
--

CREATE TABLE `Invoice` (
  `id` int(11) NOT NULL,
  `invoice_number` varchar(50) NOT NULL,
  `projectId` varchar(50) DEFAULT NULL,
  `client_name` varchar(255) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `tax` decimal(15,2) DEFAULT 0.00,
  `tax_label` varchar(50) DEFAULT 'PPN',
  `tax_rate` decimal(5,2) DEFAULT 11.00,
  `total` decimal(15,2) NOT NULL,
  `status` enum('draft','sent','paid','overdue') DEFAULT 'draft',
  `due_date` date NOT NULL,
  `paid_date` date DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `payment_terms` text DEFAULT NULL,
  `createdBy` int(11) NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp(),
  `updatedAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Invoice`
--

INSERT INTO `Invoice` (`id`, `invoice_number`, `projectId`, `client_name`, `amount`, `tax`, `tax_label`, `tax_rate`, `total`, `status`, `due_date`, `paid_date`, `notes`, `payment_terms`, `createdBy`, `createdAt`, `updatedAt`) VALUES
(1, 'IMX.2026-X-013_INV_R1', 'IMX.2026-X-012', 'Tripatra E&C', 190000000.00, 20900000.00, 'PPN', 11.00, 210900000.00, 'draft', '2026-06-30', NULL, 'Termin 1 3D Laser Scan and FEA Project ', '', 2, '2026-06-25 06:49:53', '2026-07-06 03:37:56'),
(2, 'IMX-2026-INV-014_INV_1_RevA', 'IMX.2026-X-012', 'Tripatra E&C', 50000000.00, 5500000.00, 'PPN', 11.00, 55500000.00, 'draft', '2026-06-30', NULL, '', '', 2, '2026-06-26 06:49:39', '2026-07-05 21:57:42');

-- --------------------------------------------------------

--
-- Table structure for table `InvoiceItem`
--

CREATE TABLE `InvoiceItem` (
  `id` int(11) NOT NULL,
  `invoiceId` int(11) NOT NULL,
  `description` varchar(255) NOT NULL,
  `quantity` decimal(10,2) DEFAULT 1.00,
  `unit_price` decimal(15,2) NOT NULL,
  `total` decimal(15,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `InvoiceItem`
--

INSERT INTO `InvoiceItem` (`id`, `invoiceId`, `description`, `quantity`, `unit_price`, `total`) VALUES
(13, 2, 'Termin 1 - Down Payment', 1.00, 50000000.00, 50000000.00),
(14, 1, '3D Laser Scan ', 1.00, 140000000.00, 140000000.00),
(15, 1, 'Pre Study ', 1.00, 50000000.00, 50000000.00);

-- --------------------------------------------------------

--
-- Table structure for table `ITProject`
--

CREATE TABLE `ITProject` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `token` varchar(100) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'on progress',
  `createdById` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ITProjectMember`
--

CREATE TABLE `ITProjectMember` (
  `id` int(11) NOT NULL,
  `projectId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `role` varchar(50) NOT NULL DEFAULT 'member',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ITSubtask`
--

CREATE TABLE `ITSubtask` (
  `id` int(11) NOT NULL,
  `projectId` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'subtask',
  `status` varchar(50) NOT NULL DEFAULT 'todo',
  `priority` varchar(50) NOT NULL DEFAULT 'medium',
  `progress` int(11) NOT NULL DEFAULT 0,
  `deadline` datetime(3) DEFAULT NULL,
  `createdById` int(11) NOT NULL,
  `assignedToId` int(11) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL DEFAULT current_timestamp(3) ON UPDATE current_timestamp(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `leads`
--

CREATE TABLE `leads` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `status` enum('New','Contacted','Qualified','Converted','Lost') DEFAULT 'New',
  `campaign_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `lead_interactions`
--

CREATE TABLE `lead_interactions` (
  `id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `type` varchar(50) NOT NULL,
  `notes` text NOT NULL,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Liability`
--

CREATE TABLE `Liability` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `category` enum('Hutang Bank','Hutang Usaha','Hutang Pajak','Hutang Gaji','Lainnya') NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `start_date` date NOT NULL,
  `due_date` date NOT NULL,
  `term_type` enum('short_term','long_term') NOT NULL,
  `status` enum('outstanding','settled') NOT NULL DEFAULT 'outstanding',
  `notes` text DEFAULT NULL,
  `createdBy` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `operators`
--

CREATE TABLE `operators` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` varchar(50) DEFAULT 'Operator',
  `phone` varchar(50) DEFAULT NULL,
  `avatar_url` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `operators`
--

INSERT INTO `operators` (`id`, `name`, `email`, `password`, `role`, `phone`, `avatar_url`, `created_at`) VALUES
(1, 'Admin Pusat', 'admin@erp.com', 'admin123', 'Super Admin', NULL, NULL, '2026-07-01 07:34:00');

-- --------------------------------------------------------

--
-- Table structure for table `Project`
--

CREATE TABLE `Project` (
  `id` int(11) NOT NULL,
  `prospectId` varchar(191) NOT NULL,
  `is_done` tinyint(1) NOT NULL DEFAULT 0,
  `order` int(11) NOT NULL DEFAULT 0,
  `link` varchar(191) DEFAULT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Project`
--

INSERT INTO `Project` (`id`, `prospectId`, `is_done`, `order`, `link`, `createdAt`, `updatedAt`) VALUES
(6, 'IMX.2026-X-013', 0, 0, NULL, '2026-03-18 05:14:40.000', '2026-05-05 01:21:01.000'),
(8, 'IMX.2026-X-012', 0, 0, NULL, '2026-05-25 03:57:09.000', '2026-05-25 03:57:09.000'),
(9, 'IMX.2025-X-023', 1, 0, NULL, '2026-06-08 00:39:49.000', '2026-06-08 07:40:05.000'),
(10, '21.IMX.2026-X-021', 0, 0, NULL, '2026-06-25 03:03:33.000', '2026-06-25 03:03:33.000'),
(11, '29.IMX.2026-X-029', 0, 0, NULL, '2026-07-07 07:15:43.000', '2026-07-07 07:15:43.000');

-- --------------------------------------------------------

--
-- Table structure for table `ProjectChat`
--

CREATE TABLE `ProjectChat` (
  `id` int(11) NOT NULL,
  `projectId` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `message` text NOT NULL,
  `createdAt` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `ProjectChat`
--

INSERT INTO `ProjectChat` (`id`, `projectId`, `userId`, `message`, `createdAt`) VALUES
(1, 6, 2, 'Cek pekerjaan', '2026-06-25 04:53:26'),
(2, 10, 2, 'cek pekerjaan', '2026-06-25 04:54:14');

-- --------------------------------------------------------

--
-- Table structure for table `projects`
--

CREATE TABLE `projects` (
  `id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `budget` decimal(15,2) DEFAULT 0.00,
  `status` enum('Planning','In Progress','On Hold','Completed') NOT NULL DEFAULT 'Planning',
  `progress` int(11) DEFAULT 0,
  `deadline` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Prospect`
--

CREATE TABLE `Prospect` (
  `no_project` varchar(191) NOT NULL,
  `name_project` varchar(191) NOT NULL,
  `client_name` varchar(191) NOT NULL,
  `contact_name` varchar(191) NOT NULL,
  `status` enum('LEAD','PROPOSAL','WON','LOSS','HOLD','REAL_LOSS','DONE') NOT NULL DEFAULT 'LEAD',
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `order` int(11) DEFAULT 0,
  `last_contact_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Prospect`
--

INSERT INTO `Prospect` (`no_project`, `name_project`, `client_name`, `contact_name`, `status`, `createdAt`, `updatedAt`, `order`, `last_contact_date`) VALUES
('14.IMX.2026-X-014', '14. CFD Modelling And Simulation Site ', 'PT Minezawa Trading Indonesia', 'Siti Marwah', 'HOLD', '2026-04-07 07:42:18.000', '2026-06-25 01:06:04.000', 4, NULL),
('16.IMX.2026-X-016', '16. Ammonia Stripping and Water Supplier', 'MTTST Aust', 'Zvon Labadjuk', 'LEAD', '2026-04-04 04:07:01.000', '2026-06-25 01:06:08.000', 3, '2026-06-19 04:06:58'),
('18. IMX.2026-X-018', '18. Jasa Simulasi CFD Data Center', 'PT Leighton Asia', 'Linton Panjaitan', 'PROPOSAL', '2026-04-04 03:59:29.000', '2026-06-30 01:04:06.000', 0, '2026-06-19 07:33:48'),
('19.IMX.2026-X-019', '19. Jasa Thermal Analysis dan Simulasi CFD', 'PT Puspetindo', 'M. Mansur Makruf', 'LOSS', '2026-04-04 03:57:11.000', '2026-06-17 08:09:04.000', 1, NULL),
('20 IMX.2026-X-020', '20. Tank Inspection for Styerine Monomer', 'PT SGS Indonesia', 'Christian Mario ', 'LOSS', '2026-04-10 07:35:13.000', '2026-06-17 08:09:04.000', 0, NULL),
('21.IMX.2026-X-021', '21. Simulasi CFD HVAC Magnetic Clutch Assy', 'PT TACI (Toyota Denso Automotive Compressor Indonesia)', 'Irwan Prasetyo', 'WON', '2026-04-27 08:08:21.000', '2026-07-07 07:15:43.000', 2, NULL),
('22.IMX.2026-X022', '22. Simulasi Basin Sea Coastal', 'PT Chandra Asri Pacific', 'Imam Fatharani', 'LEAD', '2026-04-30 01:42:34.000', '2026-06-25 01:06:08.000', 1, '2026-06-19 04:06:05'),
('23.IMX.2026-X-023', '23. Part Pressure Model ASME SGS - Guntner', 'PT SGS Indonesia', 'Chodi Soetjipto', 'PROPOSAL', '2026-06-05 00:48:57.000', '2026-06-30 01:04:06.000', 2, NULL),
('24.IMX.2026-X-024', '24. Design and Modelling EcoOils', 'PT Gerbang Saranabaja (GSB)', 'Wahyu Muchtriman', 'PROPOSAL', '2026-06-05 00:47:29.000', '2026-06-30 01:04:06.000', 1, NULL),
('28.IMX.2026-X-028', '28. FEA Ball Valve 2 Inch API - ASME Standard', 'PT SPV', 'K Seto', 'PROPOSAL', '2026-06-22 17:47:19.000', '2026-06-30 01:04:06.000', 3, NULL),
('29.IMX.2026-X-029', '29. 4D Laser Scan and Dimension Study', 'PT. Tripatra E&C', 'Benhard Walter Hutajulu', 'WON', '2026-06-22 18:55:40.000', '2026-07-07 07:15:43.000', 3, NULL),
('IMX.2025-X-023', '23. Adequacy Chech Coil Heater Design', 'PT Tripatra Engineers and Constructors (TPEC)', 'Galih Indro Tanoyo', 'DONE', '2026-03-11 18:56:46.000', '2026-06-17 06:32:44.000', 0, NULL),
('IMX.2026-X-003', '3. CFB PLN Boiler UPJ', 'PLN UPJ Pulang Pisau', 'Muhammad Arief', 'HOLD', '2026-03-08 03:20:39.771', '2026-06-25 01:06:04.000', 1, NULL),
('IMX.2026-X-005', '5. Polimerisasi Emulsi Numerical Scheme', 'PT Dover Chemical', 'Andri Kapuja Kaharian', 'HOLD', '2026-03-08 03:26:28.442', '2026-06-25 01:06:04.000', 5, NULL),
('IMX.2026-X-006', '6. Waste To Energy', 'MTTST Aust', 'Zvon Labadjuk', 'HOLD', '2026-03-11 03:07:07.000', '2026-06-25 01:06:04.000', 0, NULL),
('IMX.2026-X-007 ', '7. Georadar - Geotechnic', 'PT Transportasi Gas Indonesia (TGI)', 'Sigit Asmara', 'HOLD', '2026-03-11 03:09:59.000', '2026-06-25 01:06:04.000', 2, NULL),
('IMX.2026-X-008', '8. Strainer Modelling Simualtion', 'Pertamina Geothermal Energy', 'Muhammad Nashir', 'HOLD', '2026-03-10 04:37:32.000', '2026-06-25 01:06:04.000', 3, NULL),
('IMX.2026-X-012', '12. FEA - FFS AGPA Refinery Complex', 'Tripatra E&C', 'Zulfa Azizah', 'WON', '2026-03-08 01:51:36.747', '2026-07-07 07:15:43.000', 1, NULL),
('IMX.2026-X-013', '13. Die Casting Simulation TACI ', 'PT TACI', 'Irwan Prasetyo', 'WON', '2026-03-08 03:17:02.303', '2026-07-07 07:15:43.000', 0, NULL),
('IMX.2026-X-015', '15. Lube Oil Column ', 'MTTST Aust.', 'Zvon Labadjuk', 'LEAD', '2026-03-11 03:12:08.000', '2026-06-25 01:06:08.000', 2, '2026-06-19 04:06:33'),
('PRJ-1783485736948', 'Ledakan konoha', 'pt konoha', 'naruto', 'LEAD', '2026-07-08 04:42:18.104', '2026-07-08 04:50:18.696', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `prospect_subtasks`
--

CREATE TABLE `prospect_subtasks` (
  `id` int(11) NOT NULL,
  `lead_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `resource_link` varchar(255) DEFAULT NULL,
  `deadline` date DEFAULT NULL,
  `assigned_to` int(11) DEFAULT NULL,
  `status` enum('MT','IFR','EX','IFC','DONE') NOT NULL DEFAULT 'MT',
  `progress` int(11) DEFAULT 0,
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Role`
--

CREATE TABLE `Role` (
  `id` int(11) NOT NULL,
  `name` varchar(191) NOT NULL,
  `permissions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`permissions`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Role`
--

INSERT INTO `Role` (`id`, `name`, `permissions`, `createdAt`, `updatedAt`) VALUES
(3, 'Superadmin', '{\"all\": true}', '2026-03-07 02:30:23.593', '2026-03-07 02:30:23.593'),
(4, 'Admin', '{\"pages\":{\"dashboard\":true,\"crm\":true,\"prospects\":true,\"projects\":true,\"itProjects\":true,\"admin\":false}}', '2026-03-07 02:30:23.644', '2026-06-22 04:00:44.000'),
(5, 'User', '{\"pages\":{\"dashboard\":true,\"crm\":false,\"prospects\":false,\"projects\":false,\"itProjects\":false,\"admin\":false}}', '2026-03-13 06:10:36.504', '2026-06-22 03:30:33.000'),
(8, 'Manajemen', '{\"pages\":{\"dashboard\":true,\"crm\":true,\"prospects\":true,\"projects\":true,\"itProjects\":false,\"admin\":false,\"cashflow\":true,\"invoice\":true,\"saldo\":true,\"neraca\":false}}', '2026-04-29 16:32:20.193', '2026-06-25 03:51:43.000'),
(10, 'Client', '{\"pages\":{\"dashboard\":false,\"prospects\":false,\"projects\":true,\"crm\":false,\"itProjects\":false,\"admin\":false}}', '2026-06-24 04:13:02.322', '0000-00-00 00:00:00.000');

-- --------------------------------------------------------

--
-- Table structure for table `social_media_posts`
--

CREATE TABLE `social_media_posts` (
  `id` int(11) NOT NULL,
  `platform` varchar(100) NOT NULL,
  `content` text NOT NULL,
  `media_url` varchar(255) DEFAULT NULL,
  `schedule_time` datetime NOT NULL,
  `status` enum('Draft','Scheduled','Published') NOT NULL DEFAULT 'Draft',
  `engagement_likes` int(11) DEFAULT 0,
  `engagement_comments` int(11) DEFAULT 0,
  `leads_generated` int(11) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `Subtask`
--

CREATE TABLE `Subtask` (
  `id` int(11) NOT NULL,
  `projectId` int(11) DEFAULT NULL,
  `prospectId` varchar(191) DEFAULT NULL,
  `name` varchar(191) NOT NULL,
  `deadline` datetime(3) NOT NULL,
  `progress` int(11) NOT NULL DEFAULT 0,
  `createdById` int(11) NOT NULL,
  `description` text DEFAULT NULL,
  `link` varchar(191) DEFAULT NULL,
  `documents` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`documents`)),
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `assignedToId` int(11) DEFAULT NULL,
  `is_locked` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `Subtask`
--

INSERT INTO `Subtask` (`id`, `projectId`, `prospectId`, `name`, `deadline`, `progress`, `createdById`, `description`, `link`, `documents`, `createdAt`, `updatedAt`, `assignedToId`, `is_locked`) VALUES
(1, 8, 'IMX.2026-X-012', 'Proposal', '2026-03-05 08:52:00.000', 100, 2, 'Submission of Technical Proposal and Commercial Proposal', 'https://drive.google.com/drive/folders/19RXs1HAUSkPzMNfgA_DFlK5I00P9kWWm?usp=sharing', NULL, '2026-03-08 01:54:40.907', '2026-07-07 07:15:43.000', NULL, 0),
(2, 8, 'IMX.2026-X-012', 'Pre Qualification', '2026-03-12 08:56:00.000', 100, 2, 'Prequalifikasi Tender ', '', NULL, '2026-03-08 01:56:57.094', '2026-07-07 07:15:43.000', NULL, 0),
(3, 6, 'IMX.2026-X-013', 'Proposal Submission', '2026-03-05 10:17:00.000', 100, 2, 'Proposal Teknis dan proposal komersial', 'https://drive.google.com/drive/folders/1GXQMmjajqJQ1TYzqWoRdnmY0heHjYrIQ?usp=sharing', NULL, '2026-03-08 03:17:58.460', '2026-07-07 07:15:43.000', 6, 1),
(4, 6, 'IMX.2026-X-013', 'Negosiasi PO', '2026-03-13 17:18:00.000', 100, 2, 'Tahap Review Penawaran\n1. PT Ashanua Global Dinamika', '', NULL, '2026-03-08 03:18:23.727', '2026-07-07 07:15:43.000', 6, 1),
(5, NULL, 'IMX.2026-X-003', 'Introduction', '2026-02-10 17:24:00.000', 100, 2, 'Pengenalan Infimech dan PLN PJB Pulang Pisau', 'https://drive.google.com/drive/folders/1A6OFEBR60Wf_l4G6Eba_xK2RljenMcKh?usp=sharing', NULL, '2026-03-08 03:25:13.416', '2026-03-12 08:04:07.000', NULL, 0),
(6, NULL, 'IMX.2026-X-003', 'Follow Up Information', '2026-03-13 10:25:00.000', 0, 2, 'Diskusi Tingkat Lanjut', '', NULL, '2026-03-08 03:25:41.121', '2026-03-08 03:25:41.121', NULL, 0),
(7, 8, 'IMX.2026-X-012', 'Technical Clarification', '2026-03-10 11:15:00.000', 100, 2, 'Meeting dengan Tripatra Terkait Pekerjaan Tersebut', '', NULL, '2026-03-09 04:15:21.000', '2026-07-07 07:15:43.000', NULL, 0),
(8, 9, 'IMX.2025-X-023', 'Payment Confirmation and Reminder', '2026-04-09 10:00:00.000', 100, 2, 'Reminder Payment lagi Senin by Email', '', NULL, '2026-03-12 03:13:26.000', '2026-06-17 06:32:44.000', NULL, 0),
(9, NULL, 'IMX.2026-X-015', 'Reminder Update', '2026-03-17 10:13:00.000', 60, 2, 'Reminder Update Pekerjaan Proses ', '', NULL, '2026-03-12 03:14:17.000', '2026-04-27 08:08:53.000', NULL, 0),
(10, NULL, 'IMX.2026-X-015', 'Process Engineering Column ', '2026-03-02 17:14:00.000', 60, 2, 'Documen Proses Engineering', '', NULL, '2026-03-12 03:14:44.000', '2026-04-27 08:08:53.000', NULL, 0),
(11, NULL, 'IMX.2026-X-007', 'Vendor Registration', '2026-03-13 10:15:00.000', 20, 2, 'Pendaftaran Vendor Pekerjaan Geoteknik - Georadar', '', NULL, '2026-03-12 03:16:11.000', '2026-03-12 03:16:14.000', NULL, 0),
(12, NULL, 'IMX.2026-X-003', 'Pendaftaran Procurement PLN', '2026-03-13 10:22:00.000', 0, 2, 'Link Daftar Vendor PLN Pulang Pisau', 'https://smartscm.plnnusantarapower.co.id/index.php/login.shtml', NULL, '2026-03-12 03:22:08.000', '2026-03-12 03:22:08.000', NULL, 0),
(13, 6, 'IMX.2026-X-013', 'Pre Processing and 3D Modelling', '2026-04-11 09:14:00.000', 80, 2, 'Melakukan Pemodelan 3D Model\nPermasalahan antara di PPT - di Sketch up (posisi lay out kipas angin berbeda)', '', NULL, '2026-03-18 05:14:19.000', '2026-07-07 07:15:43.000', 8, 0),
(14, 8, 'IMX.2026-X-012', 'Technical Clarfification', '2026-03-27 12:15:00.000', 100, 2, 'Diskusi Final dan Scope of Work dari Pekerjaan', '', NULL, '2026-03-18 05:15:24.000', '2026-07-07 07:15:43.000', NULL, 0),
(15, NULL, '19.IMX.2026-X-019', 'Supporting Letter', '2026-04-01 10:57:00.000', 100, 2, 'Pembuatan Supporting Letter', '', NULL, '2026-04-04 03:57:42.000', '2026-04-10 11:38:25.000', NULL, 0),
(16, NULL, '18. IMX.2026-X-018', 'Proposal Technical ', '2026-04-06 10:59:00.000', 80, 2, 'Making list scope of work', '', NULL, '2026-04-04 04:00:16.000', '2026-04-08 06:58:15.000', NULL, 0),
(17, NULL, '18. IMX.2026-X-018', 'Proposal Commercial', '2026-04-06 11:00:00.000', 80, 2, 'Commercial and Quotation', '', NULL, '2026-04-04 04:00:40.000', '2026-04-08 06:58:18.000', NULL, 0),
(18, NULL, '16.IMX.2026-X-016', 'List Document and Service', '2026-04-05 18:07:00.000', 20, 2, 'List document for Service and Load\n1. MDR\n2. Proposal\n3. Quotation', '', NULL, '2026-04-04 04:07:31.000', '2026-04-07 07:42:50.000', NULL, 0),
(19, NULL, '18. IMX.2026-X-018', 'Meeting Offline', '2026-04-16 18:00:00.000', 20, 2, 'Meeting di Kantor Leighton (Jakarta Selatan) Dekat Ps Minggu Tanjung Barat\n1. Perlu support untuk kebutuhan\n2. Data hall include (van wall)\n3. Sumber rak belum ada (temporary hot)\n4. Feed out belum terlaksana\n5. Perlu dilakukan pengecekan utk variasi dari susunan rak antara 88, 120, 140', '', NULL, '2026-04-07 08:04:05.000', '2026-04-20 11:47:16.000', NULL, 0),
(20, NULL, 'IMX.2026-X-015', 'Review Hasil Pekerjaan', '2026-04-11 08:52:00.000', 0, 2, '', '', NULL, '2026-04-09 01:52:46.000', '2026-04-27 08:08:53.000', 6, 0),
(21, 6, 'IMX.2026-X-013', 'Meshing Process', '2026-04-17 16:08:00.000', 100, 2, 'Meshing awal sudah beres \nSudah sesuai', '', NULL, '2026-04-09 02:08:42.000', '2026-07-07 07:15:43.000', 7, 0),
(22, 6, 'IMX.2026-X-013', 'Processing - Simulation CFD', '2026-04-17 16:08:00.000', 100, 2, '- Perbaikan arah aliran dalam simulasi \n- Posisinya salah', '', NULL, '2026-04-09 02:09:07.000', '2026-07-07 07:15:43.000', 7, 0),
(23, NULL, '20 IMX.2026-X-020', 'Proposal dan Teknis', '2026-04-14 14:35:00.000', 20, 2, '', '', NULL, '2026-04-10 07:35:27.000', '2026-04-10 11:36:13.000', NULL, 0),
(24, NULL, '19.IMX.2026-X-019', 'Technical Proposal dan Requirement', '2026-04-13 18:38:00.000', 40, 2, '', '', NULL, '2026-04-10 11:38:39.000', '2026-06-05 01:01:22.000', NULL, 0),
(25, NULL, '18. IMX.2026-X-018', 'Meeting Diskusi', '2026-04-15 21:41:00.000', 0, 2, '1. Posisi belum ada FEED\n', '', NULL, '2026-04-15 07:41:10.000', '2026-04-15 07:42:23.000', NULL, 0),
(26, NULL, '14.IMX.2026-X-014', 'Collecting Data ', '2026-04-24 09:19:00.000', 0, 2, '', '', NULL, '2026-04-16 02:19:42.000', '2026-04-20 11:51:03.000', NULL, 0),
(27, 6, 'IMX.2026-X-013', 'Progress Meeting', '2026-04-22 11:03:00.000', 100, 2, 'Meeting Offline with TACI for Progress Presentation\n1. Point diskusi\n2. Temuannya\n3. Diskusi sabtu besok \n', '', NULL, '2026-04-18 03:03:48.000', '2026-07-07 07:15:43.000', 3, 0),
(28, 6, 'IMX.2026-X-013', 'Meeting Offline dengan TACI', '2026-04-24 12:09:00.000', 100, 2, '1. meeting\n2. Heat source\n3. Arah kipas\n- 1.5 m\n- 4 m\n- 6 m\n- 8 m\n4. Crosscheck\n- wall fan \n- jet fan\n5. Replacement posisi dan placement\n-Pak Irwan : bedakan warna antara (wall fan, jet fan, fan)\n- crosscheck\n- posisi jet fan\n6. Referensi\n- Heat source dari kemarin\n- Arah fan\n7. Progress Report \n- Detailing hasil placement dan lay outnya\n8. Boundary sumber fan\n\nTarget \n1 Bulan sebelum RUPS (Juni selesai instalasi)\n- Mei (utk submission)\n- Area 1.5 - 2 meter, utk manusia gerak\n- menguji ide \n- pointnya 1.5 m/s\n\nFeedback\n1. Warna aliran udara hal yang bagus yang warna biru\n2. Cenderung merah itu kurang (skala warna ) reverse rainbow\n3. Semakin rendah yang biru \n4. Video simulasi utk aliran bergerak\n5.  Video visual (warna dan batasan warna yang jelas), animasinya memudahkan mereka (arah angin bergerak)\n6. Exhaust menyala terus (sumber panas nyela terus)\n7. On time, hasil CFD utk kecepatan dan suhu (kecepatan) 1.5 m', '', NULL, '2026-04-21 07:09:56.000', '2026-07-07 07:15:43.000', NULL, 0),
(29, NULL, '14.IMX.2026-X-014', 'Meeting offline', '2026-04-23 17:21:00.000', 0, 2, '1. Luas ruangan area sesuaid dari PDF\n2. SUmber panas\n- forklift \n- 3 posisi (forklift)\n- 2 melitng\n- 1 casting\n- heat treatment\n\n- 37 - 38 deg \n\n- keinginannya 5 deg \n\n- Kondisi operating \n\n- Info\n', '', NULL, '2026-04-23 03:21:57.000', '2026-04-23 03:48:34.000', NULL, 0),
(30, 10, '21.IMX.2026-X-021', 'Pembuatan Penawaran utk simulasi', '2026-04-27 15:08:00.000', 100, 2, '', '', NULL, '2026-04-27 08:08:39.000', '2026-07-07 07:15:43.000', NULL, 0),
(31, NULL, '22.IMX.2026-X022', 'Pre Meeting Online', '2026-05-03 06:00:00.000', 20, 2, '', '', NULL, '2026-04-30 01:42:51.000', '2026-06-22 00:41:33.000', 9, 0),
(32, 6, 'IMX.2026-X-013', 'TOTAL DURASI PROJECT', '2026-06-05 08:21:00.000', 100, 2, 'Durasi Total pekerjaan', '', NULL, '2026-05-05 01:21:46.000', '2026-07-07 07:15:43.000', NULL, 0),
(33, 8, 'IMX.2026-X-012', 'Submit Report Sitevisit', '2026-06-17 21:41:00.000', 100, 2, 'Modelling Ametank - 3D - CFD - FEM', '', NULL, '2026-06-05 00:42:16.000', '2026-07-07 07:15:43.000', 8, 0),
(34, 8, 'IMX.2026-X-012', 'Pre Study Permasalahan Design', '2026-06-19 01:41:00.000', 40, 2, '1. Adequacy Check\n- Study dan comparasi hasil kalkulasi vs API 650\n- FEA Study utk menambah report hasil study design', '', NULL, '2026-06-05 00:42:18.000', '2026-07-07 07:15:43.000', 8, 0),
(35, 8, 'IMX.2026-X-012', 'Informasi Vendor PT SKS', '2026-06-06 14:43:00.000', 100, 2, '1. Pembayaran DP : 60% (jadwal site minggu ini) requirement\n2. Persiapan pre survey di lapagan', '', NULL, '2026-06-05 00:43:09.000', '2026-07-07 07:15:43.000', 6, 0),
(37, 8, 'IMX.2026-X-012', 'Site Visit dan 3D Laser Scan Inspection', '2026-06-12 07:43:00.000', 100, 2, '', '', NULL, '2026-06-05 00:44:03.000', '2026-07-07 07:15:43.000', 5, 0),
(38, 10, '21.IMX.2026-X-021', 'Submisson Penawaran', '2026-06-03 14:59:00.000', 100, 2, '1. Telah dikomunikasikan oleh tim Pak Irwan (Proses PO)', '', NULL, '2026-06-05 00:59:46.000', '2026-07-07 07:15:43.000', 9, 0),
(39, NULL, '19.IMX.2026-X-019', 'Update Penawaran Ke Puspetindo By Email', '2026-06-11 15:01:00.000', 0, 2, '', '', NULL, '2026-06-05 01:02:11.000', '2026-06-05 03:02:22.000', 9, 0),
(40, 10, '21.IMX.2026-X-021', 'Follow Up by WA', '2026-06-05 10:48:00.000', 100, 2, 'Follow up proses PO minggu depan', '', NULL, '2026-06-05 03:48:40.000', '2026-07-07 07:15:43.000', NULL, 0),
(41, 8, 'IMX.2026-X-012', 'Whatsapp Communication', '2026-06-05 10:49:00.000', 100, 2, '', '', NULL, '2026-06-05 03:49:35.000', '2026-07-07 07:15:43.000', NULL, 0),
(42, NULL, 'IMX.2026-X-005', 'NDA Email', '2026-06-07 07:40:00.000', 20, 2, 'Cek email', '', NULL, '2026-06-08 00:40:56.000', '2026-06-08 00:41:02.000', 9, 0),
(43, 6, 'IMX.2026-X-013', 'Meeting Progress Hasil Simulasi', '2026-06-09 09:00:00.000', 100, 2, 'Meeting online dengan TACI terkait update pekerjaan dan reporting', '', NULL, '2026-06-08 00:47:10.000', '2026-07-07 07:15:43.000', 7, 0),
(45, NULL, '16.IMX.2026-X-016', 'Follow up MOC', '2026-06-08 09:21:00.000', 0, 2, 'Follow up MOC bulan Juli/ Agustus', '', NULL, '2026-06-08 02:21:31.000', '2026-06-08 02:21:31.000', NULL, 0),
(46, NULL, '18. IMX.2026-X-018', 'Komunikasi Whatsapp', '2026-06-08 09:29:00.000', 0, 2, 'Menunggu update dari pak Linton kira kira tgl 15 juni', '', NULL, '2026-06-08 02:29:43.000', '2026-06-08 02:29:43.000', NULL, 0),
(47, NULL, '19.IMX.2026-X-019', 'Komunikasi Whatsapp', '2026-06-08 09:31:00.000', 0, 2, 'Baru disubmit minggu lalu, akan dikontak 1-2 minggu lagi awal bulan juni', '', NULL, '2026-06-08 02:31:37.000', '2026-06-08 02:31:37.000', NULL, 0),
(48, 6, 'IMX.2026-X-013', 'Study Simulasi Variasi', '2026-06-18 02:00:00.000', 100, 2, 'Pekerjaan berupa running model simulasi variasi 1 (Inlet ventilasi) outlet exhaust, fan jet mati untuk mengetahui tujuan dari performa alami dari alat tersebut', '', NULL, '2026-06-16 23:55:32.000', '2026-07-07 07:15:43.000', 7, 0),
(51, NULL, '22.IMX.2026-X022', 'Tes', '2026-06-25 01:00:00.000', 0, 2, 'Cobs', '', NULL, '2026-06-22 00:40:39.000', '2026-06-22 00:40:39.000', NULL, 0),
(52, NULL, '22.IMX.2026-X022', 'Tes', '2026-06-22 09:45:00.000', 20, 2, 'Coba', '', NULL, '2026-06-22 00:42:06.000', '2026-06-22 01:17:22.000', 9, 0),
(53, NULL, '28.IMX.2026-X-028', 'Submission Penawaran', '2026-06-22 13:08:00.000', 100, 2, 'Pengumpulan Penawaran ke SPV', '', NULL, '2026-06-22 17:48:05.000', '2026-06-22 17:49:17.000', 9, 0),
(54, NULL, '28.IMX.2026-X-028', 'PO Waiting for Approval', '2026-06-25 10:00:00.000', 0, 2, 'Updating Information for our latest Quotation', '', NULL, '2026-06-22 17:49:14.000', '2026-06-22 17:49:14.000', 9, 0),
(55, 11, '29.IMX.2026-X-029', 'Inquiry ke SKS utk 4D laser scan', '2026-06-23 09:34:00.000', 0, 2, 'Mengirimkan inquiry kebutuhan laser scan', '', NULL, '2026-06-22 21:34:48.000', '2026-07-07 07:15:43.000', 9, 0),
(56, 10, '21.IMX.2026-X-021', 'Pembuatan 3D Model', '2026-06-29 11:53:00.000', 0, 2, '', '', NULL, '2026-06-25 04:54:09.000', '2026-07-07 07:15:43.000', 8, 0),
(57, 11, '29.IMX.2026-X-029', 'Klarififikasi Annaul report financial ke email tertera', '2026-07-06 05:59:00.000', 0, 2, 'Menanyakan kejelasan terkait pendaftaran vendor atau client list ke Tripatra\n\nFinan Syah K (Mr) : finan.kusuma@tripatra.com / ‪+6281283292276‬\nDwi Untari H (Ms) : dwi.harnani@tripatra.com / ‪+6285283254164\n\nEmail dulu ke org tersebut lanjut WA', '', NULL, '2026-07-05 23:00:41.000', '2026-07-07 07:15:43.000', 9, 0),
(58, 11, '29.IMX.2026-X-029', 'Meeting Technical Clarification', '2026-07-06 06:01:00.000', 0, 2, 'Tanyakan ke Pak Bugy terkait detail pekerjaan tersebut dan output hasilnya', '', NULL, '2026-07-05 23:02:16.000', '2026-07-07 07:15:43.000', NULL, 0),
(59, 11, '29.IMX.2026-X-029', 'Claim terkait DP di awal utk pekerjaan ini', '2026-07-06 06:02:00.000', 0, 2, '', '', NULL, '2026-07-05 23:03:04.000', '2026-07-07 07:15:43.000', 9, 0),
(60, 6, 'IMX.2026-X-013', 'Detailing Report Informasi', '2026-07-06 06:03:00.000', 0, 2, 'Memberikan detail informasi di dalam report\n1. Buatkan detail hasil pengamatan terkait report tersebut\n2. point2 penting yang harus terakomodir di dalam report tersebut\n3. tambahan data seperti informasi pelengkap dan model simulasi skema yg lainnya', '', NULL, '2026-07-05 23:03:56.000', '2026-07-07 07:15:43.000', 7, 0),
(61, 8, 'IMX.2026-X-012', 'Report 3D Laser Scan tank', '2026-07-08 06:05:00.000', 0, 2, 'Pengerjaan report untuk 3D laser scan dari PT SKS ', '', NULL, '2026-07-05 23:05:50.000', '2026-07-07 07:15:43.000', 6, 0),
(62, 8, 'IMX.2026-X-012', 'Simulasi FEA 3D Laser Scan Tank 19', '2026-07-06 06:06:00.000', 0, 2, 'Penyusunan report simulasi FEA\n1. Meshing sudah bisa pakai surface thickness \n2. solver tidak support, penggunaan CPU tidak boleh maksimal\n3. VRAM dinaikkan \n4. Analysis setting, di bawah meshing di atas solution\n5. ', '', NULL, '2026-07-05 23:06:18.000', '2026-07-07 07:15:43.000', 8, 0),
(63, 8, 'IMX.2026-X-012', 'Simulasi General Design', '2026-07-06 07:07:00.000', 0, 2, 'Surface model dan connection', '', NULL, '2026-07-06 00:08:02.000', '2026-07-07 07:15:43.000', 6, 0);

-- --------------------------------------------------------

--
-- Table structure for table `UnearnedRevenue`
--

CREATE TABLE `UnearnedRevenue` (
  `id` int(11) NOT NULL,
  `invoiceId` int(11) NOT NULL,
  `projectId` varchar(191) NOT NULL,
  `amount` decimal(15,2) NOT NULL,
  `category` enum('Down Payment','Progress Payment','Pelunasan') NOT NULL,
  `received_date` date NOT NULL,
  `status` enum('pending','recognized') NOT NULL DEFAULT 'pending',
  `recognized_at` datetime DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `createdBy` int(11) NOT NULL,
  `createdAt` datetime NOT NULL DEFAULT current_timestamp(),
  `updatedAt` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `User`
--

CREATE TABLE `User` (
  `id` int(11) NOT NULL,
  `username` varchar(191) NOT NULL,
  `name` varchar(191) DEFAULT NULL,
  `email` varchar(191) DEFAULT NULL,
  `password` varchar(191) NOT NULL,
  `roleId` int(11) NOT NULL,
  `createdAt` datetime(3) NOT NULL DEFAULT current_timestamp(3),
  `updatedAt` datetime(3) NOT NULL,
  `is_approved` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `User`
--

INSERT INTO `User` (`id`, `username`, `name`, `email`, `password`, `roleId`, `createdAt`, `updatedAt`, `is_approved`) VALUES
(2, 'admin', NULL, 'admin@gmail.com', '$2b$10$QakjeYCRGelAOCpC0J9MTOHvOd6zypm4450sZ7nTwFVqiplcjTnLe', 3, '2026-03-07 02:30:23.735', '2026-07-08 02:51:04.000', 1),
(3, 'raihan', NULL, 'raihan.ts16b@gmail.com', '$2b$10$T1ZhtoMjSRMncFE4LNFKG.Aj2M8tHsoPOTmSob5SqCLCUf1IaAVGm', 5, '2026-03-07 02:39:28.005', '2026-03-13 06:32:50.000', 1),
(5, 'aji', NULL, 'ajicandra.l@infimech.tech', '$2b$10$B58/9sDS9VqRsC5vohp2fubh25VlGGJ/DnAzPIbFr/PBdTkDE/8CO', 4, '2026-03-13 06:32:02.000', '2026-06-23 00:14:45.000', 1),
(6, 'aji_candra', NULL, 'aji.candra.l.cfs@gmail.com', '$2b$10$tahLmJFDdhBG5slH6dmD1OSB9/4AIgQhuzFHTjh0NDSjKYamGV4Wi', 5, '2026-04-09 01:51:37.000', '2026-04-09 02:07:44.000', 1),
(7, 'gilangdw', NULL, 'gilangdw@outlook.com', '$2b$10$cbl7eC4zDWLAiiCYarvlf.0r/r7CD/ZlCY6S8ogRWXgl4XO4IzChK', 5, '2026-04-09 01:54:39.000', '2026-04-09 02:02:44.000', 1),
(8, 'anggriawan', NULL, 'ang2r16@gmail.com', '$2b$10$TfdUdilvCb6CXgAKSeyYJ.NliA.j7jD4xLIhA7VwKCc.PNgelV5G6', 4, '2026-04-09 02:10:31.000', '2026-06-23 01:08:17.000', 1),
(9, 'baruna', NULL, 'baruna.work@gmail.com', '$2b$10$jiMkhkTvGJ.8va6DDQJU6eH0hUF2HG.e4rIzGnzkmKFZVPIlvHHNK', 8, '2026-04-29 16:34:49.000', '2026-04-29 16:34:49.000', 1),
(10, 'septa', NULL, 'septaagil354@gmail.com', '$2b$10$w/WW88x1XGpRcwCGrDze3ufOQk6h4eKjNqtiRVmaEkZeclgfh1Xx.', 10, '2026-06-22 03:20:21.000', '2026-06-24 04:47:44.000', 1),
(11, 'paundra', NULL, 'paundrar6@gmail.com', '$2b$10$P/KALg1w//ogaCW/868eoOwBikYj60dCdYLTMGnXMjTelTnEc30FG', 4, '2026-06-22 03:21:04.000', '2026-06-22 03:21:04.000', 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `role` enum('Superadmin','Admin','Digital Marketing','Operator') NOT NULL DEFAULT 'Operator',
  `status` enum('Active','Inactive') NOT NULL DEFAULT 'Active',
  `avatar_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `phone`, `role`, `status`, `avatar_url`, `created_at`, `updated_at`) VALUES
(1, 'Super Admin', 'admin@gmail.com', '$2a$10$gmajt6J7Vcxt47Y1SWD1RORIc9FJ.f3q1J4wdJEu2bM0ulyDQryqe', '+6281122334455', 'Superadmin', 'Active', NULL, '2026-07-06 04:42:23', '2026-07-08 01:17:02'),
(2, 'Baruna', 'baruna.work@gmail.com', '$2a$10$CV.b0Gz6Q/KnN/eRWBf1WuvYpB3bQXC7AJsxUQ6ksAlI5jeaSmlcq', '+6289988776655', 'Admin', 'Active', 'https://api.dicebear.com/7.x/adventurer/svg?seed=Baruna', '2026-07-06 04:42:23', '2026-07-08 01:41:30'),
(5, 'Andra', 'paundrar6@gmail.com', '$2a$10$VenFd/eSea4IVKyPw9YlJuLmPL1T7cmLttNr.iiI.yQMQiEHP3PAi', '+6281216784771', 'Operator', 'Active', NULL, '2026-07-07 00:05:53', '2026-07-07 00:07:15');

-- --------------------------------------------------------

--
-- Table structure for table `_ProjectAdmins`
--

CREATE TABLE `_ProjectAdmins` (
  `A` int(11) NOT NULL,
  `B` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_ProjectAdmins`
--

INSERT INTO `_ProjectAdmins` (`A`, `B`) VALUES
(6, 5),
(8, 5),
(10, 5);

-- --------------------------------------------------------

--
-- Table structure for table `_ProjectClients`
--

CREATE TABLE `_ProjectClients` (
  `A` int(11) NOT NULL,
  `B` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `_ProjectClients`
--

INSERT INTO `_ProjectClients` (`A`, `B`) VALUES
(8, 10);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `assets`
--
ALTER TABLE `assets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_assets_created_by_User` (`created_by`);

--
-- Indexes for table `budgets`
--
ALTER TABLE `budgets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `campaign_id` (`campaign_id`);

--
-- Indexes for table `campaigns`
--
ALTER TABLE `campaigns`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Cashflow`
--
ALTER TABLE `Cashflow`
  ADD PRIMARY KEY (`id`),
  ADD KEY `createdBy` (`createdBy`);

--
-- Indexes for table `Client`
--
ALTER TABLE `Client`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `ClientContact`
--
ALTER TABLE `ClientContact`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_ClientContact_Client` (`clientId`);

--
-- Indexes for table `ClientNote`
--
ALTER TABLE `ClientNote`
  ADD PRIMARY KEY (`id`),
  ADD KEY `clientId` (`clientId`);

--
-- Indexes for table `clients`
--
ALTER TABLE `clients`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_clients_owner_id_User` (`owner_id`);

--
-- Indexes for table `client_contacts`
--
ALTER TABLE `client_contacts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_client_contacts_Client` (`client_id`);

--
-- Indexes for table `Config`
--
ALTER TABLE `Config`
  ADD PRIMARY KEY (`key`);

--
-- Indexes for table `content_calendar`
--
ALTER TABLE `content_calendar`
  ADD PRIMARY KEY (`id`),
  ADD KEY `campaign_id` (`campaign_id`);

--
-- Indexes for table `FixedAsset`
--
ALTER TABLE `FixedAsset`
  ADD PRIMARY KEY (`id`),
  ADD KEY `FixedAsset_createdBy_fkey` (`createdBy`);

--
-- Indexes for table `interactions`
--
ALTER TABLE `interactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `lead_id` (`lead_id`);

--
-- Indexes for table `Invoice`
--
ALTER TABLE `Invoice`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `invoice_number` (`invoice_number`),
  ADD KEY `createdBy` (`createdBy`);

--
-- Indexes for table `InvoiceItem`
--
ALTER TABLE `InvoiceItem`
  ADD PRIMARY KEY (`id`),
  ADD KEY `invoiceId` (`invoiceId`);

--
-- Indexes for table `ITProject`
--
ALTER TABLE `ITProject`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `token` (`token`),
  ADD KEY `fk_it_project_creator` (`createdById`);

--
-- Indexes for table `ITProjectMember`
--
ALTER TABLE `ITProjectMember`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_project_user` (`projectId`,`userId`),
  ADD KEY `fk_it_project_member_user` (`userId`);

--
-- Indexes for table `ITSubtask`
--
ALTER TABLE `ITSubtask`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_it_subtask_project` (`projectId`),
  ADD KEY `fk_it_subtask_creator` (`createdById`),
  ADD KEY `fk_it_subtask_assignee` (`assignedToId`);

--
-- Indexes for table `leads`
--
ALTER TABLE `leads`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `campaign_id` (`campaign_id`);

--
-- Indexes for table `lead_interactions`
--
ALTER TABLE `lead_interactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_lead_interactions_Client` (`lead_id`),
  ADD KEY `fk_lead_interactions_created_by_User` (`created_by`);

--
-- Indexes for table `Liability`
--
ALTER TABLE `Liability`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Liability_createdBy_fkey` (`createdBy`);

--
-- Indexes for table `operators`
--
ALTER TABLE `operators`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `Project`
--
ALTER TABLE `Project`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Project_prospectId_key` (`prospectId`);

--
-- Indexes for table `ProjectChat`
--
ALTER TABLE `ProjectChat`
  ADD PRIMARY KEY (`id`),
  ADD KEY `projectId` (`projectId`),
  ADD KEY `userId` (`userId`);

--
-- Indexes for table `projects`
--
ALTER TABLE `projects`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_projects_Client` (`client_id`);

--
-- Indexes for table `Prospect`
--
ALTER TABLE `Prospect`
  ADD PRIMARY KEY (`no_project`);

--
-- Indexes for table `prospect_subtasks`
--
ALTER TABLE `prospect_subtasks`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_prospect_subtasks_Client` (`lead_id`),
  ADD KEY `fk_prospect_subtasks_assigned_to_User` (`assigned_to`),
  ADD KEY `fk_prospect_subtasks_created_by_User` (`created_by`);

--
-- Indexes for table `Role`
--
ALTER TABLE `Role`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `Role_name_key` (`name`);

--
-- Indexes for table `social_media_posts`
--
ALTER TABLE `social_media_posts`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `Subtask`
--
ALTER TABLE `Subtask`
  ADD PRIMARY KEY (`id`),
  ADD KEY `Subtask_projectId_fkey` (`projectId`),
  ADD KEY `Subtask_prospectId_fkey` (`prospectId`),
  ADD KEY `Subtask_createdById_fkey` (`createdById`),
  ADD KEY `fk_subtask_assignee` (`assignedToId`);

--
-- Indexes for table `UnearnedRevenue`
--
ALTER TABLE `UnearnedRevenue`
  ADD PRIMARY KEY (`id`),
  ADD KEY `UnearnedRevenue_invoiceId_fkey` (`invoiceId`),
  ADD KEY `UnearnedRevenue_projectId_fkey` (`projectId`),
  ADD KEY `UnearnedRevenue_createdBy_fkey` (`createdBy`);

--
-- Indexes for table `User`
--
ALTER TABLE `User`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `User_username_key` (`username`),
  ADD UNIQUE KEY `User_email_key` (`email`),
  ADD KEY `User_roleId_fkey` (`roleId`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `_ProjectAdmins`
--
ALTER TABLE `_ProjectAdmins`
  ADD UNIQUE KEY `_ProjectAdmins_AB_unique` (`A`,`B`),
  ADD KEY `_ProjectAdmins_B_index` (`B`);

--
-- Indexes for table `_ProjectClients`
--
ALTER TABLE `_ProjectClients`
  ADD PRIMARY KEY (`A`,`B`),
  ADD KEY `B` (`B`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `assets`
--
ALTER TABLE `assets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `budgets`
--
ALTER TABLE `budgets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `campaigns`
--
ALTER TABLE `campaigns`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `Cashflow`
--
ALTER TABLE `Cashflow`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `Client`
--
ALTER TABLE `Client`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=86;

--
-- AUTO_INCREMENT for table `ClientContact`
--
ALTER TABLE `ClientContact`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=158;

--
-- AUTO_INCREMENT for table `ClientNote`
--
ALTER TABLE `ClientNote`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `clients`
--
ALTER TABLE `clients`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `client_contacts`
--
ALTER TABLE `client_contacts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `content_calendar`
--
ALTER TABLE `content_calendar`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `FixedAsset`
--
ALTER TABLE `FixedAsset`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `interactions`
--
ALTER TABLE `interactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `Invoice`
--
ALTER TABLE `Invoice`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `InvoiceItem`
--
ALTER TABLE `InvoiceItem`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `ITProject`
--
ALTER TABLE `ITProject`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ITProjectMember`
--
ALTER TABLE `ITProjectMember`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ITSubtask`
--
ALTER TABLE `ITSubtask`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `leads`
--
ALTER TABLE `leads`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `lead_interactions`
--
ALTER TABLE `lead_interactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `Liability`
--
ALTER TABLE `Liability`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `operators`
--
ALTER TABLE `operators`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Project`
--
ALTER TABLE `Project`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `ProjectChat`
--
ALTER TABLE `ProjectChat`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `projects`
--
ALTER TABLE `projects`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=61;

--
-- AUTO_INCREMENT for table `prospect_subtasks`
--
ALTER TABLE `prospect_subtasks`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `Role`
--
ALTER TABLE `Role`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `social_media_posts`
--
ALTER TABLE `social_media_posts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `Subtask`
--
ALTER TABLE `Subtask`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=64;

--
-- AUTO_INCREMENT for table `UnearnedRevenue`
--
ALTER TABLE `UnearnedRevenue`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `User`
--
ALTER TABLE `User`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `assets`
--
ALTER TABLE `assets`
  ADD CONSTRAINT `fk_assets_created_by_User` FOREIGN KEY (`created_by`) REFERENCES `User` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `budgets`
--
ALTER TABLE `budgets`
  ADD CONSTRAINT `budgets_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `Cashflow`
--
ALTER TABLE `Cashflow`
  ADD CONSTRAINT `Cashflow_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`);

--
-- Constraints for table `ClientContact`
--
ALTER TABLE `ClientContact`
  ADD CONSTRAINT `ClientContact_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_ClientContact_Client` FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ClientNote`
--
ALTER TABLE `ClientNote`
  ADD CONSTRAINT `ClientNote_ibfk_1` FOREIGN KEY (`clientId`) REFERENCES `Client` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `clients`
--
ALTER TABLE `clients`
  ADD CONSTRAINT `fk_clients_owner_id_User` FOREIGN KEY (`owner_id`) REFERENCES `User` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `client_contacts`
--
ALTER TABLE `client_contacts`
  ADD CONSTRAINT `fk_client_contacts_Client` FOREIGN KEY (`client_id`) REFERENCES `Client` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `content_calendar`
--
ALTER TABLE `content_calendar`
  ADD CONSTRAINT `content_calendar_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `FixedAsset`
--
ALTER TABLE `FixedAsset`
  ADD CONSTRAINT `FixedAsset_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`);

--
-- Constraints for table `interactions`
--
ALTER TABLE `interactions`
  ADD CONSTRAINT `interactions_ibfk_1` FOREIGN KEY (`lead_id`) REFERENCES `leads` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `Invoice`
--
ALTER TABLE `Invoice`
  ADD CONSTRAINT `Invoice_ibfk_1` FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`);

--
-- Constraints for table `InvoiceItem`
--
ALTER TABLE `InvoiceItem`
  ADD CONSTRAINT `InvoiceItem_ibfk_1` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ITProject`
--
ALTER TABLE `ITProject`
  ADD CONSTRAINT `fk_it_project_creator` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ITProjectMember`
--
ALTER TABLE `ITProjectMember`
  ADD CONSTRAINT `fk_it_project_member_project` FOREIGN KEY (`projectId`) REFERENCES `ITProject` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_it_project_member_user` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `ITSubtask`
--
ALTER TABLE `ITSubtask`
  ADD CONSTRAINT `fk_it_subtask_assignee` FOREIGN KEY (`assignedToId`) REFERENCES `User` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_it_subtask_creator` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`),
  ADD CONSTRAINT `fk_it_subtask_project` FOREIGN KEY (`projectId`) REFERENCES `ITProject` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `leads`
--
ALTER TABLE `leads`
  ADD CONSTRAINT `leads_ibfk_1` FOREIGN KEY (`campaign_id`) REFERENCES `campaigns` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `lead_interactions`
--
ALTER TABLE `lead_interactions`
  ADD CONSTRAINT `fk_lead_interactions_Client` FOREIGN KEY (`lead_id`) REFERENCES `Client` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_lead_interactions_created_by_User` FOREIGN KEY (`created_by`) REFERENCES `User` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `Liability`
--
ALTER TABLE `Liability`
  ADD CONSTRAINT `Liability_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`);

--
-- Constraints for table `Project`
--
ALTER TABLE `Project`
  ADD CONSTRAINT `Project_prospectId_fkey` FOREIGN KEY (`prospectId`) REFERENCES `Prospect` (`no_project`) ON UPDATE CASCADE;

--
-- Constraints for table `ProjectChat`
--
ALTER TABLE `ProjectChat`
  ADD CONSTRAINT `ProjectChat_ibfk_1` FOREIGN KEY (`projectId`) REFERENCES `Project` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `ProjectChat_ibfk_2` FOREIGN KEY (`userId`) REFERENCES `User` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `projects`
--
ALTER TABLE `projects`
  ADD CONSTRAINT `fk_projects_Client` FOREIGN KEY (`client_id`) REFERENCES `Client` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `prospect_subtasks`
--
ALTER TABLE `prospect_subtasks`
  ADD CONSTRAINT `fk_prospect_subtasks_Client` FOREIGN KEY (`lead_id`) REFERENCES `Client` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_prospect_subtasks_assigned_to_User` FOREIGN KEY (`assigned_to`) REFERENCES `User` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `fk_prospect_subtasks_created_by_User` FOREIGN KEY (`created_by`) REFERENCES `User` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `Subtask`
--
ALTER TABLE `Subtask`
  ADD CONSTRAINT `Subtask_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `User` (`id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `Subtask_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `Subtask_prospectId_fkey` FOREIGN KEY (`prospectId`) REFERENCES `Prospect` (`no_project`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_subtask_assignee` FOREIGN KEY (`assignedToId`) REFERENCES `User` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `UnearnedRevenue`
--
ALTER TABLE `UnearnedRevenue`
  ADD CONSTRAINT `UnearnedRevenue_createdBy_fkey` FOREIGN KEY (`createdBy`) REFERENCES `User` (`id`),
  ADD CONSTRAINT `UnearnedRevenue_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice` (`id`),
  ADD CONSTRAINT `UnearnedRevenue_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Prospect` (`no_project`);

--
-- Constraints for table `User`
--
ALTER TABLE `User`
  ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role` (`id`) ON UPDATE CASCADE;

--
-- Constraints for table `_ProjectAdmins`
--
ALTER TABLE `_ProjectAdmins`
  ADD CONSTRAINT `_ProjectAdmins_A_fkey` FOREIGN KEY (`A`) REFERENCES `Project` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `_ProjectAdmins_B_fkey` FOREIGN KEY (`B`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `_ProjectClients`
--
ALTER TABLE `_ProjectClients`
  ADD CONSTRAINT `_ProjectClients_ibfk_1` FOREIGN KEY (`A`) REFERENCES `Project` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `_ProjectClients_ibfk_2` FOREIGN KEY (`B`) REFERENCES `User` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
