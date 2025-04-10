// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/common/ERC2981Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ZodiacNFT
 * @dev NFT contract for Zodiac Card Farcaster mini app on Base network
 */
contract ZodiacNFT is 
    Initializable, 
    ERC721Upgradeable,
    ERC721URIStorageUpgradeable,
    ERC2981Upgradeable,
    OwnableUpgradeable,
    UUPSUpgradeable 
{
    using Strings for uint256;

    // Token ID counter
    uint256 private _nextTokenId;

    // Minting fee in USDC (6 decimals)
    uint256 public mintFee;

    // Treasury address for fee collection
    address payable public treasuryAddress;

    // USDC token contract
    IERC20 public usdcToken;

    // Events
    event NFTMinted(address indexed to, uint256 indexed tokenId, string uri);
    event MintFeeUpdated(uint256 newFee);
    event TreasuryAddressUpdated(address newTreasury);
    event USDCContractUpdated(address newUSDCContract);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name,
        string memory symbol,
        uint256 initialMintFee,
        address initialOwner,
        address payable initialTreasury,
        address _usdcAddress
    ) public initializer {
        __ERC721_init(name, symbol);
        __ERC721URIStorage_init();
        __ERC2981_init();
        __Ownable_init();
        __UUPSUpgradeable_init();

        mintFee = initialMintFee;
        _nextTokenId = 1;
        treasuryAddress = initialTreasury;
        usdcToken = IERC20(_usdcAddress);

        // Set default royalty to 2.5%
        _setDefaultRoyalty(initialOwner, 250);
        transferOwnership(initialOwner);
    }

    function mint(address to, string memory metadataURI) public returns (uint256) {
        require(bytes(metadataURI).length > 0, "Metadata URI cannot be empty");
        
        // Transfer USDC from user to treasury
        require(usdcToken.transferFrom(msg.sender, treasuryAddress, mintFee), "USDC transfer failed");

        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, metadataURI);

        emit NFTMinted(to, tokenId, metadataURI);

        return tokenId;
    }

    // Owner functions
    function setMintFee(uint256 newFee) external onlyOwner {
        mintFee = newFee;
        emit MintFeeUpdated(newFee);
    }

    function setTreasuryAddress(address payable newTreasury) external onlyOwner {
        require(newTreasury != address(0), "Invalid treasury address");
        treasuryAddress = newTreasury;
        emit TreasuryAddressUpdated(newTreasury);
    }

    function setUSDCContract(address newUSDCContract) external onlyOwner {
        require(newUSDCContract != address(0), "Invalid USDC contract address");
        usdcToken = IERC20(newUSDCContract);
        emit USDCContractUpdated(newUSDCContract);
    }

    // View functions
    function nextTokenId() public view returns (uint256) {
        return _nextTokenId;
    }

    // Required overrides
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // The following functions are overrides required by Solidity
    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        require(_exists(tokenId), "URI query for nonexistent token");
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721Upgradeable, ERC721URIStorageUpgradeable, ERC2981Upgradeable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _burn(uint256 tokenId) internal override(ERC721Upgradeable, ERC721URIStorageUpgradeable) {
        super._burn(tokenId);
        _resetTokenRoyalty(tokenId);
    }
} 