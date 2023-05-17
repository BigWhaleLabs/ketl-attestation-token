//                                                                        ,-,
//                            *                      .                   /.(              .
//                                       \|/                             \ {
//    .                 _    .  ,   .    -*-       .                      `-`
//     ,'-.         *  / \_ *  / \_      /|\         *   /\'__        *.                 *
//    (____".         /    \  /    \,     __      .    _/  /  \  * .               .
//               .   /\/\  /\/ :' __ \_  /  \       _^/  ^/    `—./\    /\   .
//   *       _      /    \/  \  _/  \-‘\/  ` \ /\  /.' ^_   \_   .’\\  /_/\           ,'-.
//          /_\   /\  .-   `. \/     \ /.     /  \ ;.  _/ \ -. `_/   \/.   \   _     (____".    *
//     .   /   \ /  `-.__ ^   / .-'.--\      -    \/  _ `--./ .-'  `-/.     \ / \             .
//        /     /.       `.  / /       `.   /   `  .-'      '-._ `._         /.  \
// ~._,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'2_,-'
// ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~ ~~~~~~~~
// ~~    ~~~~    ~~~~     ~~~~   ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~~~    ~~
//     ~~     ~~      ~~      ~~      ~~      ~~      ~~      ~~       ~~     ~~      ~~      ~~
//                          ๐
//                                                                              _
//                                                  ₒ                         ><_>
//                                  _______     __      _______
//          .-'                    |   _  "\   |" \    /" _   "|                               ๐
//     '--./ /     _.---.          (. |_)  :)  ||  |  (: ( \___)
//     '-,  (__..-`       \        |:     \/   |:  |   \/ \
//        \          .     |       (|  _  \\   |.  |   //  \ ___
//         `,.__.   ,__.--/        |: |_)  :)  |\  |   (:   _(  _|
//           '._/_.'___.-`         (_______/   |__\|    \_______)                 ๐
//
//                  __   __  ___   __    __         __       ___         _______
//                 |"  |/  \|  "| /" |  | "\       /""\     |"  |       /"     "|
//      ๐          |'  /    \:  |(:  (__)  :)     /    \    ||  |      (: ______)
//                 |: /'        | \/      \/     /' /\  \   |:  |   ₒ   \/    |
//                  \//  /\'    | //  __  \\    //  __'  \   \  |___    // ___)_
//                  /   /  \\   |(:  (  )  :)  /   /  \\  \ ( \_|:  \  (:      "|
//                 |___/    \___| \__|  |__/  (___/    \___) \_______)  \_______)
//                                                                                     ₒ৹
//                          ___             __       _______     ________
//         _               |"  |     ₒ     /""\     |   _  "\   /"       )
//       ><_>              ||  |          /    \    (. |_)  :) (:   \___/
//                         |:  |         /' /\  \   |:     \/   \___  \
//                          \  |___     //  __'  \  (|  _  \\    __/  \\          \_____)\_____
//                         ( \_|:  \   /   /  \\  \ |: |_)  :)  /" \   :)         /--v____ __`<
//                          \_______) (___/    \___)(_______/  (_______/                  )/
//                                                                                        '
//
//            ๐                          .    '    ,                                           ₒ
//                         ₒ               _______
//                                 ____  .`_|___|_`.  ____
//                                        \ \   / /                        ₒ৹
//                                          \ ' /                         ๐
//   ₒ                                        \/
//                                   ₒ     /      \       )                                 (
//           (   ₒ৹               (                      (                                  )
//            )                   )               _      )                )                (
//           (        )          (       (      ><_>    (       (        (                  )
//     )      )      (     (      )       )              )       )        )         )      (
//    (      (        )     )    (       (              (       (        (         (        )
// ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
// ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@big-whale-labs/versioned-contract/contracts/Versioned.sol";
import "@opengsn/contracts/src/ERC2771Recipient.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@zk-kit/incremental-merkle-tree.sol/IncrementalBinaryTree.sol";
import "./interfaces/IAttestationCheckerVerifier.sol";
import "./interfaces/IPasswordCheckerVerifier.sol";

contract KetlAttestation is ERC1155, Ownable, Versioned, ERC2771Recipient {
  using Counters for Counters.Counter;
  using IncrementalBinaryTree for IncrementalTreeData;

  // Attestations
  uint public attestorPublicKey;
  mapping(uint => uint) public attestationMerkleRoots;
  IAttestationCheckerVerifier public attestationCheckerVerifier;
  // Entanglements
  mapping(uint => IncrementalTreeData) public entanglementsTrees;
  mapping(uint => uint[]) public entanglements;
  mapping(uint => mapping(bytes32 => bool)) public entanglementsRoots;
  mapping(uint => bool) private attestationHashesEntangled;

  mapping(uint => Counters.Counter) public entanglementsCounts;
  mapping(uint => uint16) private minimumEntanglementCounts;
  IPasswordCheckerVerifier public passwordCheckerVerifier;
  // Nullifiers
  mapping(uint => bool) public nullifiers;
  // Legacy
  bool public legacyMintLocked;

  constructor(
    string memory _uri,
    string memory _version,
    uint _attestorPublicKey,
    address _attestationCheckerVerifier,
    address _passwordCheckerVerifier,
    address _forwarder
  ) ERC1155(_uri) Versioned(_version) {
    attestorPublicKey = _attestorPublicKey;
    attestationCheckerVerifier = IAttestationCheckerVerifier(
      _attestationCheckerVerifier
    );
    passwordCheckerVerifier = IPasswordCheckerVerifier(
      _passwordCheckerVerifier
    );
    _setTrustedForwarder(_forwarder);
  }

  function setUri(string memory _uri) public onlyOwner {
    _setURI(_uri);
  }

  function addAttestationMerkleRoot(
    uint _id,
    uint _merkleRoot,
    uint16 _minimumEntanglementCount
  ) public onlyOwner {
    attestationMerkleRoots[_id] = _merkleRoot;
    minimumEntanglementCounts[_id] = _minimumEntanglementCount;
    entanglementsTrees[_id].init(20, 0);
  }

  function setMinimumEntanglementCount(
    uint _id,
    uint16 _minimumEntanglementCount
  ) public onlyOwner {
    minimumEntanglementCounts[_id] = _minimumEntanglementCount;
  }

  function registerEntanglement(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint[5] memory input
  ) external {
    // Destruct the input
    uint attestationType = input[0];
    uint attestationMerkleRoot = input[1];
    uint entanglement = input[2];
    uint attestationHash = input[3];
    uint attestationPublicKey = input[4];
    // Check the proof
    require(
      attestationCheckerVerifier.verifyProof(a, b, c, input),
      "Invalid ZK proof"
    );
    // Check if this attestation has already been used
    require(
      !attestationHashesEntangled[attestationHash],
      "Attestation has already been entangled"
    );
    // Check the attestations merkle root
    require(
      attestationMerkleRoots[attestationType] == attestationMerkleRoot,
      "Attestation merkle root is wrong"
    );
    // Check the attestation pubkey
    require(
      attestationPublicKey == attestorPublicKey,
      "Attestation public key is wrong"
    );
    // Save the entanglement fact
    attestationHashesEntangled[attestationHash] = true;
    // Add the entanglement to the tree
    entanglementsTrees[attestationType].insert(entanglement);
    // Save the entanglement in the array
    entanglements[attestationType].push(entanglement);
    // Increment the entanglement count
    entanglementsCounts[attestationType].increment();
    // Register the entanglement root
    bytes32 merkleRoot = bytes32(entanglementsTrees[attestationType].root);
    entanglementsRoots[attestationType][merkleRoot] = true;
  }

  function mint(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint[3] memory input
  ) external {
    // Deconstruct input
    uint _attestationType = input[0];
    uint _nullifier = input[1];
    uint _entanglementMerkleRoot = input[2];
    // Check requirements
    require(
      passwordCheckerVerifier.verifyProof(a, b, c, input),
      "ZKP is not valid"
    );
    require(!nullifiers[_nullifier], "Nullifier has already been used");
    require(
      entanglementsRoots[_attestationType][bytes32(_entanglementMerkleRoot)],
      "Entanglement merkle root is not valid"
    );
    // Save nullifier
    nullifiers[_nullifier] = true;
    // Mint token
    _mint(_msgSender(), _attestationType, 1, "");
  }

  // Legacy mint

  function legacyBatchMint(
    address[] memory _to,
    uint[] memory _ids
  ) external onlyOwner {
    require(!legacyMintLocked, "Legacy mint is locked");
    for (uint i = 0; i < _to.length; i++) {
      _mint(_to[i], _ids[i], 1, "");
    }
  }

  function lockLegacyMint() external onlyOwner {
    legacyMintLocked = true;
  }

  // Make it soulbound

  function _beforeTokenTransfer(
    address operator,
    address from,
    address to,
    uint[] memory ids,
    uint[] memory amounts,
    bytes memory data
  ) internal override {
    require(from == address(0), "This token is soulbound");
    super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
  }

  // OpenGSN boilerplate

  function _msgSender()
    internal
    view
    override(Context, ERC2771Recipient)
    returns (address sender)
  {
    sender = ERC2771Recipient._msgSender();
  }

  function _msgData()
    internal
    view
    override(Context, ERC2771Recipient)
    returns (bytes calldata ret)
  {
    return ERC2771Recipient._msgData();
  }
}
