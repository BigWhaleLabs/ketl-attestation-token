// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@big-whale-labs/versioned-contract/contracts/Versioned.sol";
import "@opengsn/contracts/src/ERC2771Recipient.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IAttestationCheckerVerifier.sol";

contract KetlAttestation is ERC1155, Ownable, Versioned, ERC2771Recipient {
  uint public attestorPublicKey;
  IAttestationCheckerVerifier public attestationCheckerVerifier;
  mapping(uint => uint) public attestationMerkleRoots;
  mapping(uint => bool) public nullifiers;

  constructor(
    string memory _uri,
    string memory _version,
    uint _attestorPublicKey,
    address _attestationCheckerVerifier
  ) ERC1155(_uri) Versioned(_version) {
    attestorPublicKey = _attestorPublicKey;
    attestationCheckerVerifier = IAttestationCheckerVerifier(
      _attestationCheckerVerifier
    );
  }

  function setUri(string memory _uri) public onlyOwner {
    _setURI(_uri);
  }

  function addAttestationMerkleRoot(
    uint _id,
    uint _merkleRoot
  ) public onlyOwner {
    attestationMerkleRoots[_id] = _merkleRoot;
  }

  // Mint only if the attestation is valid
  function mint(
    uint[2] memory a,
    uint[2][2] memory b,
    uint[2] memory c,
    uint[4] memory input
  ) public onlyOwner {
    // Deconstruct input
    uint _id = input[0];
    uint _merkleRoot = input[1];
    uint _attestorPublicKey = input[2];
    uint _nullifier = input[3];
    // Check requirements
    require(
      attestationMerkleRoots[_id] == _merkleRoot,
      "Merkle root is not valid"
    );
    require(nullifiers[_nullifier] == false, "Nullifier has already been used");
    require(
      _attestorPublicKey ==
        uint(keccak256(abi.encodePacked(attestorPublicKey))),
      "Attestor public key is not valid"
    );
    require(
      attestationCheckerVerifier.verifyProof(a, b, c, input),
      "Attestation is not valid"
    );
    // Mint token
    _mint(_msgSender(), _id, 1, "");
  }

  function _beforeTokenTransfer(
    address operator,
    address from,
    address to,
    uint256[] memory ids,
    uint256[] memory amounts,
    bytes memory data
  ) internal override {
    require(from == address(0), "This token is soulbound");
    super._beforeTokenTransfer(operator, from, to, ids, amounts, data);
  }

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
