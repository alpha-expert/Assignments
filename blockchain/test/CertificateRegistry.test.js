const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CertificateRegistry", function () {
  let registry, owner, otherAccount;

  beforeEach(async () => {
    [owner, otherAccount] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("CertificateRegistry");
    registry = await Factory.deploy();
  });

  it("should issue a certificate and emit an event", async () => {
    const tx = await registry.issueCertificate(
      1,
      "Alice Johnson",
      "Best Student 2024",
      "QmTestCID123"
    );
    const receipt = await tx.wait();
    expect(receipt.status).to.equal(1);
  });

  it("should verify a valid certificate", async () => {
    const tx = await registry.issueCertificate(1, "Alice", "Award", "QmCID");
    const receipt = await tx.wait();

    // Pull certificateId from the emitted event
    const event = receipt.logs.find(
      (log) => log.fragment?.name === "CertificateIssued"
    );
    const certId = event.args[0];

    const [isValid, studentId, studentName] = await registry.verifyCertificate(certId);
    expect(isValid).to.equal(true);
    expect(studentId).to.equal(1n);
    expect(studentName).to.equal("Alice");
  });

  it("should revoke a certificate", async () => {
    const tx = await registry.issueCertificate(2, "Bob", "Award", "QmCID2");
    const receipt = await tx.wait();
    const event = receipt.logs.find((log) => log.fragment?.name === "CertificateIssued");
    const certId = event.args[0];

    await registry.revokeCertificate(certId);
    const [isValid] = await registry.verifyCertificate(certId);
    expect(isValid).to.equal(false);
  });

  it("should reject issue from non-owner", async () => {
    await expect(
      registry.connect(otherAccount).issueCertificate(3, "Carol", "Award", "QmCID3")
    ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
  });

  it("should list all certificates for a student", async () => {
    await registry.issueCertificate(5, "Dave", "Award A", "QmA");

    // Small delay to ensure different timestamp (different block)
    await ethers.provider.send("evm_mine", []);
    await registry.issueCertificate(5, "Dave", "Award B", "QmB");

    const ids = await registry.getStudentCertificates(5);
    expect(ids.length).to.equal(2);
  });
});
